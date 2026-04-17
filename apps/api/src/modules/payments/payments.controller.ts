import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('order')
  @Roles(UserRole.STUDENT)
  createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(user.id, dto);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const payload = req.rawBody?.toString() ?? JSON.stringify(req.body);
    await this.paymentsService.handleWebhook(payload, signature);
    return { status: 'ok' };
  }

  @Post('coupon/validate')
  @Roles(UserRole.STUDENT)
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.paymentsService.validateCoupon(dto);
  }

  @Get('history')
  @Roles(UserRole.STUDENT)
  getHistory(@CurrentUser() user: any) {
    return this.paymentsService.getHistory(user.id);
  }

  @Get('transactions')
  @Roles(UserRole.ADMIN)
  getAllTransactions() {
    return this.paymentsService.getAllTransactions();
  }

  @Post('refund/:transactionId')
  @Roles(UserRole.ADMIN)
  refund(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    return this.paymentsService.refund(transactionId);
  }
}
