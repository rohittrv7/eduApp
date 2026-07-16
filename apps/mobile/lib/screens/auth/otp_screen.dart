import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/config/theme.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();
  
  int _countdown = 300; // 5 minutes
  Timer? _timer;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _countdown = 300;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown == 0) {
        setState(() {
          timer.cancel();
        });
      } else {
        setState(() {
          _countdown--;
        });
      }
    });
  }

  String _formatTimer() {
    final m = _countdown ~/ 60;
    final s = _countdown % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  Future<void> _handleVerify() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _errorMessage = null);
    
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.verifyOtp(_otpController.text.trim());

    if (success && mounted) {
      context.go('/');
    } else if (mounted) {
      setState(() => _errorMessage = 'Invalid verification code. Please try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppTheme.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: SizedBox(
            height: size.height * 0.75,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 20),
                  Text(
                    'Enter Security Code',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'We sent a 6-digit verification code to your email address. Please enter it below to verify.',
                    style: TextStyle(
                      fontSize: 14.5,
                      color: AppTheme.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Verification field
                  TextFormField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 8,
                      fontFamily: 'monospace',
                    ),
                    decoration: const InputDecoration(
                      hintText: '••••••',
                      counterText: '',
                      labelText: 'VERIFICATION CODE',
                      alignLabelWithHint: true,
                    ),
                    validator: (val) {
                      if (val == null || val.trim().length != 6) {
                        return 'Enter a 6-digit code';
                      }
                      return null;
                    },
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Countdown timer & resend button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _countdown > 0
                            ? 'Code expires in ${_formatTimer()}'
                            : 'Code expired',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _countdown > 0 ? AppTheme.textSecondary : Colors.redAccent,
                        ),
                      ),
                      TextButton(
                        onPressed: _countdown > 0 ? null : _startTimer,
                        child: Text(
                          'Resend Code',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _countdown > 0 ? Colors.grey.shade300 : AppTheme.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ],
                  
                  const SizedBox(height: 32),
                  
                  ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleVerify,
                    child: auth.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Verify & Continue'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
