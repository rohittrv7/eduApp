import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Coupon, DiscountType } from './entities/coupon.entity';
import { TeacherPayout, PayoutStatus } from './entities/teacher-payout.entity';
import { Batch } from '../batches/entities/batch.entity';
import { Enrollment } from '../batches/entities/enrollment.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class PaymentsService {
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(TeacherPayout)
    private readonly payoutRepo: Repository<TeacherPayout>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly configService: ConfigService,
  ) {
    this.razorpayKeyId = this.configService.get<string>('razorpay.keyId') ?? '';
    this.razorpayKeySecret = this.configService.get<string>('razorpay.keySecret') ?? '';
    this.webhookSecret = this.configService.get<string>('razorpay.webhookSecret') ?? '';
  }

  async createOrder(studentId: string, dto: CreateOrderDto): Promise<object> {
    const batch = await this.batchRepo.findOne({ where: { id: dto.batch_id } });
    if (!batch) throw new NotFoundException(`Batch ${dto.batch_id} not found`);

    let amount = Number(batch.price);
    let discountAmount = 0;
    let coupon: Coupon | null = null;

    if (dto.coupon_code) {
      const result = await this.validateCoupon({ code: dto.coupon_code, amount });
      discountAmount = amount - result.discountedAmount;
      amount = result.discountedAmount;
      coupon = result.coupon;
    }

    const finalAmount = Math.max(0, amount);

    // Create Razorpay order via API
    const razorpayOrder = await this.createRazorpayOrder(finalAmount);

    const transaction = this.transactionRepo.create({
      student_id: studentId,
      batch_id: dto.batch_id,
      amount: Number(batch.price),
      discount_amount: discountAmount,
      final_amount: finalAmount,
      currency: 'INR',
      gateway: 'razorpay',
      gateway_order_id: razorpayOrder.id,
      status: TransactionStatus.PENDING,
      coupon_id: coupon?.id ?? null,
    });
    await this.transactionRepo.save(transaction);

    return {
      orderId: razorpayOrder.id,
      amount: finalAmount,
      currency: 'INR',
      keyId: this.razorpayKeyId,
      transactionId: transaction.id,
    };
  }

  private async createRazorpayOrder(amount: number): Promise<{ id: string }> {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
      }),
    });
    if (!response.ok) {
      throw new BadRequestException('Failed to create Razorpay order');
    }
    return response.json() as Promise<{ id: string }>;
  }

  async validateCoupon(
    dto: ValidateCouponDto,
  ): Promise<{ discountedAmount: number; coupon: Coupon }> {
    const coupon = await this.couponRepo.findOne({ where: { code: dto.code, is_active: true } });
    if (!coupon) throw new BadRequestException('Invalid or inactive coupon code');

    if (coupon.expires_at && new Date() > coupon.expires_at) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    let discountedAmount = dto.amount;
    if (coupon.discount_type === DiscountType.PERCENTAGE) {
      discountedAmount = dto.amount * (1 - Number(coupon.discount_value) / 100);
    } else {
      discountedAmount = Math.max(0, dto.amount - Number(coupon.discount_value));
    }

    return { discountedAmount, coupon };
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    if (!this.webhookSecret) {
      throw new UnauthorizedException('Razorpay webhook secret is not configured');
    }

    const expectedSig = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig);
    const signatureBuf = Buffer.from(signature || '');

    if (
      expectedBuf.length !== signatureBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = JSON.parse(payload) as { event: string; payload: any };

    if (event.event === 'payment.captured') {
      const paymentId = event.payload?.payment?.entity?.id;
      const orderId = event.payload?.payment?.entity?.order_id;
      if (orderId) {
        const transaction = await this.transactionRepo.findOne({
          where: { gateway_order_id: orderId },
        });
        if (transaction) {
          transaction.status = TransactionStatus.SUCCESS;
          transaction.gateway_payment_id = paymentId;
          await this.transactionRepo.save(transaction);

          // Enroll student
          if (transaction.batch_id) {
            await this.enrollStudent(
              transaction.student_id,
              transaction.batch_id,
              transaction.coupon_id,
            );
          }
        }
      }
    } else if (event.event === 'payment.failed') {
      const orderId = event.payload?.payment?.entity?.order_id;
      if (orderId) {
        await this.transactionRepo.update(
          { gateway_order_id: orderId },
          { status: TransactionStatus.FAILED },
        );
      }
    }
  }

  private async enrollStudent(
    studentId: string,
    batchId: string,
    couponId?: string | null,
  ): Promise<void> {
    const existing = await this.enrollmentRepo.findOne({
      where: { student_id: studentId, batch_id: batchId },
    });
    if (existing) return;

    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    const expiresAt =
      batch && batch.trial_days > 0
        ? new Date(Date.now() + batch.trial_days * 24 * 60 * 60 * 1000)
        : null;

    const enrollment = this.enrollmentRepo.create({
      student_id: studentId,
      batch_id: batchId,
      is_active: true,
      expires_at: expiresAt,
    });
    await this.enrollmentRepo.save(enrollment);

    // Increment coupon used_count
    if (couponId) {
      await this.couponRepo.increment({ id: couponId }, 'used_count', 1);
    }
  }

  async getHistory(studentId: string): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: { student_id: studentId },
      relations: ['batch'],
      order: { created_at: 'DESC' },
    });
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.find({
      relations: ['student', 'batch'],
      order: { created_at: 'DESC' },
    });
  }

  async refund(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({ where: { id: transactionId } });
    if (!transaction) throw new NotFoundException(`Transaction ${transactionId} not found`);
    if (transaction.status !== TransactionStatus.SUCCESS) {
      throw new BadRequestException('Only successful transactions can be refunded');
    }

    // Submit refund to Razorpay
    if (transaction.gateway_payment_id) {
      const response = await fetch(
        `https://api.razorpay.com/v1/payments/${transaction.gateway_payment_id}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64')}`,
          },
          body: JSON.stringify({ amount: Math.round(Number(transaction.final_amount) * 100) }),
        },
      );
      if (!response.ok) {
        throw new BadRequestException('Failed to submit refund to Razorpay');
      }
    }

    transaction.status = TransactionStatus.REFUNDED;
    return this.transactionRepo.save(transaction);
  }
}
