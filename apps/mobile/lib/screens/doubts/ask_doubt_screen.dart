import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/doubt_provider.dart';
import 'package:alledu_mobile/config/theme.dart';

class AskDoubtScreen extends StatefulWidget {
  const AskDoubtScreen({super.key});

  @override
  State<AskDoubtScreen> createState() => _AskDoubtScreenState();
}

class _AskDoubtScreenState extends State<AskDoubtScreen> {
  final _formKey = GlobalKey<FormState>();
  final _textController = TextEditingController();
  String? _errorMessage;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _errorMessage = null);
    
    final doubtsProv = Provider.of<DoubtProvider>(context, listen: false);
    final success = await doubtsProv.createDoubt(
      text: _textController.text.trim(),
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Doubt posted successfully!'), backgroundColor: Colors.green),
      );
      context.pop();
    } else if (mounted) {
      setState(() => _errorMessage = 'Failed to submit doubt. Please try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final doubtsProv = Provider.of<DoubtProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppTheme.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Ask a Doubt',
          style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Post your query to the desk',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 6),
              const Text(
                'Describe what you are struggling with. Peer students and teachers will help resolve it.',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 28),
              
              // Doubt text input
              TextFormField(
                controller: _textController,
                maxLines: 6,
                minLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Type your question or doubt here...',
                  labelText: 'QUESTION DETAIL',
                  alignLabelWithHint: true,
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter some details about your doubt';
                  }
                  if (val.trim().length < 10) {
                    return 'Please provide a more descriptive query (min 10 chars)';
                  }
                  return null;
                },
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
                onPressed: doubtsProv.isLoading ? null : _handleSubmit,
                child: doubtsProv.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Post Doubt'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
