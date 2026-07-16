import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/models/batch.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

class LiveClassPlayerScreen extends StatefulWidget {
  final String classId;

  const LiveClassPlayerScreen({super.key, required this.classId});

  @override
  State<LiveClassPlayerScreen> createState() => _LiveClassPlayerScreenState();
}

class _LiveClassPlayerScreenState extends State<LiveClassPlayerScreen> {
  YoutubePlayerController? _controller;
  final _chatController = TextEditingController();
  final List<String> _chatMessages = [
    'Welcome to the live session! Feel free to ask questions here.',
    'Sir, please explain the last step of this equation again.',
    'Got it! Thank you sir!',
    'Is the PDF notes uploaded for this chapter?',
  ];

  @override
  void initState() {
    super.initState();
    _initPlayer();
  }

  void _initPlayer() {
    final batchProv = Provider.of<BatchProvider>(context, listen: false);
    
    // Find class details
    final liveClass = batchProv.liveClasses.firstWhere(
      (c) => c.id == widget.classId,
      orElse: () => liveClassFallback,
    );

    // Fallback youtube video ID if empty
    final youtubeId = liveClass.youtubeVideoId ?? 'n8X9_MgEdCg';

    _controller = YoutubePlayerController(
      initialVideoId: youtubeId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
        isLive: true,
      ),
    );
  }

  // Fallback data helper
  LiveClass get liveClassFallback => LiveClass(
        id: widget.classId,
        title: 'Video Lecture Session',
        description: 'Detail overview explanation of topics.',
        scheduledAt: DateTime.now().toIso8601String(),
        status: 'live',
        youtubeVideoId: 'n8X9_MgEdCg',
      );

  @override
  void deactivate() {
    _controller?.pause();
    super.deactivate();
  }

  @override
  void dispose() {
    _controller?.dispose();
    _chatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final batchProv = Provider.of<BatchProvider>(context);
    final liveClass = batchProv.liveClasses.firstWhere(
      (c) => c.id == widget.classId,
      orElse: () => liveClassFallback,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppTheme.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          liveClass.title,
          style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Youtube Player Widget
          YoutubePlayerBuilder(
            player: YoutubePlayer(
              controller: _controller!,
              showVideoProgressIndicator: true,
              progressIndicatorColor: AppTheme.primary,
            ),
            builder: (context, player) {
              return player;
            },
          ),
          
          // Info header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(6)),
                      child: const Text('LIVE STREAM', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        liveClass.title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                    ),
                  ],
                ),
                if (liveClass.description != null && liveClass.description!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    liveClass.description!,
                    style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary, height: 1.4),
                  ),
                ],
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          // Live Chat simulation area
          Expanded(
            child: Container(
              color: Colors.grey.shade50,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    color: Colors.white,
                    child: const Row(
                      children: [
                        Icon(Icons.chat_bubble_outline, size: 16, color: AppTheme.textSecondary),
                        SizedBox(width: 8),
                        Text(
                          'Lecture Live Chat',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _chatMessages.length,
                      itemBuilder: (context, index) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                radius: 10,
                                backgroundColor: AppTheme.primary.withOpacity(0.1),
                                child: const Text('U', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppTheme.border),
                                  ),
                                  child: Text(
                                    _chatMessages[index],
                                    style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  
                  // Text input
                  Container(
                    padding: const EdgeInsets.all(12),
                    color: Colors.white,
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _chatController,
                            style: const TextStyle(fontSize: 13),
                            decoration: InputDecoration(
                              hintText: 'Say something in chat...',
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              fillColor: Colors.grey.shade50,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.send, color: AppTheme.primary, size: 20),
                          onPressed: () {
                            final text = _chatController.text.trim();
                            if (text.isNotEmpty) {
                              setState(() {
                                _chatMessages.add(text);
                                _chatController.clear();
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
