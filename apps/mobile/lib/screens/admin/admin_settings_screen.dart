import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/core/api/api_client.dart';

class AdminSettingsScreen extends StatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  State<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends State<AdminSettingsScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  bool _isSaving = false;

  final _nameCtrl = TextEditingController(text: 'allEdu');
  final _logoCtrl = TextEditingController();
  final _colorCtrl = TextEditingController(text: '#1a56db');
  final _emailCtrl = TextEditingController();

  final _fbCtrl = TextEditingController();
  final _instaCtrl = TextEditingController();
  final _ytCtrl = TextEditingController();
  final _twitterCtrl = TextEditingController();

  String _smsGateway = 'MSG91';
  final _smsKeyCtrl = TextEditingController();

  String _paymentGateway = 'Razorpay';
  final _razorpayKeyCtrl = TextEditingController();
  final _razorpaySecretCtrl = TextEditingController();
  final _fcmKeyCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchSettings();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _logoCtrl.dispose();
    _colorCtrl.dispose();
    _emailCtrl.dispose();
    _fbCtrl.dispose();
    _instaCtrl.dispose();
    _ytCtrl.dispose();
    _twitterCtrl.dispose();
    _smsKeyCtrl.dispose();
    _razorpayKeyCtrl.dispose();
    _razorpaySecretCtrl.dispose();
    _fcmKeyCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchSettings() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/admin/settings');
      if (res.data != null) {
        final data = res.data;
        setState(() {
          _nameCtrl.text = data['platformName'] ?? 'allEdu';
          _logoCtrl.text = data['logoUrl'] ?? '';
          _colorCtrl.text = data['brandingColor'] ?? '#1a56db';
          _emailCtrl.text = data['contactEmail'] ?? '';
          _fbCtrl.text = data['socialFacebook'] ?? '';
          _instaCtrl.text = data['socialInstagram'] ?? '';
          _ytCtrl.text = data['socialYoutube'] ?? '';
          _twitterCtrl.text = data['socialTwitter'] ?? '';
          _smsGateway = data['smsGateway'] ?? 'MSG91';
          _paymentGateway = data['paymentGateway'] ?? 'Razorpay';
        });
      }
    } catch (_) {
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isSaving = true);
    try {
      await _apiClient.patch('/admin/settings', data: {
        'platformName': _nameCtrl.text.trim(),
        'logoUrl': _logoCtrl.text.trim(),
        'brandingColor': _colorCtrl.text.trim(),
        'contactEmail': _emailCtrl.text.trim(),
        'socialFacebook': _fbCtrl.text.trim(),
        'socialInstagram': _instaCtrl.text.trim(),
        'socialYoutube': _ytCtrl.text.trim(),
        'socialTwitter': _twitterCtrl.text.trim(),
        'smsGateway': _smsGateway,
        'paymentGateway': _paymentGateway,
      });
      if (mounted) {
        messenger.showSnackBar(const SnackBar(content: Text('Platform settings saved successfully!')));
      }
    } catch (_) {
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Platform Settings',
          style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // General Section (1:1 Web Screenshot 4)
                  _buildSectionHeader('General'),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.border)),
                    child: Column(
                      children: [
                        _buildInputField('Platform Name', _nameCtrl, 'allEdu'),
                        const SizedBox(height: 12),
                        _buildInputField('Logo URL', _logoCtrl, 'https://example.com/logo.png'),
                        const SizedBox(height: 12),
                        _buildInputField('Branding Color', _colorCtrl, '#1a56db'),
                        const SizedBox(height: 12),
                        _buildInputField('Contact Email', _emailCtrl, 'contact@example.com'),
                        const SizedBox(height: 16),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text('Social Links', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildInputField('Facebook', _fbCtrl, 'https://facebook.com/...')),
                            const SizedBox(width: 10),
                            Expanded(child: _buildInputField('Instagram', _instaCtrl, 'https://instagram.com/...')),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildInputField('Youtube', _ytCtrl, 'https://youtube.com/...')),
                            const SizedBox(width: 10),
                            Expanded(child: _buildInputField('Twitter', _twitterCtrl, 'https://twitter.com/...')),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _isSaving ? null : _saveSettings,
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                          child: _isSaving ? const CircularProgressIndicator(color: Colors.white) : const Text('Save General Settings'),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Integrations Section (1:1 Web Screenshot 4)
                  _buildSectionHeader('Integrations'),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.border)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('SMS Gateway', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                                  const SizedBox(height: 4),
                                  Builder(
                                    builder: (context) {
                                      const options = ['MSG91', 'Twilio', 'Fast2SMS'];
                                      final selected = options.firstWhere(
                                        (opt) => opt.toLowerCase() == _smsGateway.toLowerCase(),
                                        orElse: () => options.first,
                                      );
                                      return DropdownButtonFormField<String>(
                                        value: selected,
                                        items: options.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                                        onChanged: (val) => setState(() => _smsGateway = val ?? 'MSG91'),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(child: _buildInputField('SMS API Key', _smsKeyCtrl, '••••••••', obscure: true)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Payment Gateway', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                                  const SizedBox(height: 4),
                                  Builder(
                                    builder: (context) {
                                      const options = ['Razorpay', 'Stripe', 'PhonePe'];
                                      final selected = options.firstWhere(
                                        (opt) => opt.toLowerCase() == _paymentGateway.toLowerCase(),
                                        orElse: () => options.first,
                                      );
                                      return DropdownButtonFormField<String>(
                                        value: selected,
                                        items: options.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                                        onChanged: (val) => setState(() => _paymentGateway = val ?? 'Razorpay'),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(child: _buildInputField('Razorpay Key ID', _razorpayKeyCtrl, 'rzp_live_...')),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildInputField('Razorpay Webhook Secret', _razorpaySecretCtrl, '••••••••', obscure: true),
                        const SizedBox(height: 12),
                        _buildInputField('FCM Server Key', _fcmKeyCtrl, '••••••••', obscure: true),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _isSaving ? null : _saveSettings,
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                          child: const Text('Save Integrations'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
    );
  }

  Widget _buildInputField(String label, TextEditingController controller, String hint, {bool obscure = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(
            hintText: hint,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
      ],
    );
  }
}
