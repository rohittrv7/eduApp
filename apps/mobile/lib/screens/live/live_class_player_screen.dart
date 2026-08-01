import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:alledu_mobile/config/theme.dart';
import 'package:alledu_mobile/models/batch.dart';

// ---------------------------------------------------------------------------
// Screen entry point
// ---------------------------------------------------------------------------
class LiveClassPlayerScreen extends StatefulWidget {
  final String classId;

  const LiveClassPlayerScreen({super.key, required this.classId});

  @override
  State<LiveClassPlayerScreen> createState() => _LiveClassPlayerScreenState();
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
class _LiveClassPlayerScreenState extends State<LiveClassPlayerScreen> {
  // ---- API / data state ----------------------------------------------------
  final ApiClient _apiClient = ApiClient();
  LiveClass? _liveClass;
  bool _isLoading = true;
  String? _error;

  // ---- WebView controller --------------------------------------------------
  InAppWebViewController? _webCtrl;

  // ---- Player state --------------------------------------------------------
  bool _isPlaying = false;
  bool _isMuted = true; // starts muted (autoplay requirement)
  double _currentTime = 0;
  double _duration = 0;
  double _playbackSpeed = 1.0;
  bool _isReady = false;

  // ---- UI state ------------------------------------------------------------
  bool _showControls = true;
  bool _isFullscreen = false;
  Timer? _hideControlsTimer;
  Timer? _timePoller;

  // ---- Chat state ----------------------------------------------------------
  final _chatController = TextEditingController();
  final List<String> _chatMessages = [
    'Welcome to the live session! Feel free to ask questions here.',
    'Sir, please explain the last step again.',
    'Got it! Thank you sir!',
    'Is the PDF uploaded for this chapter?',
  ];

  // ---- Playback speed options ----------------------------------------------
  static const List<double> _speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  @override
  void initState() {
    super.initState();
    _fetchLiveClass();
  }

  @override
  void dispose() {
    _hideControlsTimer?.cancel();
    _timePoller?.cancel();
    _chatController.dispose();
    if (_isFullscreen) _exitFullscreen();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // API
  // ---------------------------------------------------------------------------
  Future<void> _fetchLiveClass() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await _apiClient.get('/live-classes/${widget.classId}');
      final data = res.data is Map ? (res.data['data'] ?? res.data) : res.data;
      final liveClass = LiveClass.fromJson(data as Map<String, dynamic>);
      setState(() {
        _liveClass = liveClass;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load live class. Please try again.';
        _isLoading = false;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Controls visibility
  // ---------------------------------------------------------------------------
  void _showControlsTemporarily() {
    setState(() => _showControls = true);
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showControls = false);
    });
  }

  void _cancelAutoHide() {
    _hideControlsTimer?.cancel();
  }

  // ---------------------------------------------------------------------------
  // JavaScript bridge helpers
  // ---------------------------------------------------------------------------
  Future<void> _jsPlay() async {
    await _webCtrl?.evaluateJavascript(source: 'ytPlay()');
    await _jsUnmute();
    setState(() => _isPlaying = true);
  }

  Future<void> _jsPause() async {
    await _webCtrl?.evaluateJavascript(source: 'ytPause()');
    setState(() => _isPlaying = false);
  }

  Future<void> _jsSeek(double seconds) async {
    await _webCtrl?.evaluateJavascript(source: 'ytSeek($seconds)');
    setState(() => _currentTime = seconds);
  }

  Future<void> _jsUnmute() async {
    await _webCtrl?.evaluateJavascript(source: 'ytUnmute()');
    setState(() => _isMuted = false);
  }

  Future<void> _jsSpeed(double speed) async {
    await _webCtrl?.evaluateJavascript(source: 'ytSpeed($speed)');
    setState(() => _playbackSpeed = speed);
  }

  Future<void> _jsListen() async {
    await _webCtrl?.evaluateJavascript(source: 'ytListen()');
  }

  // ---------------------------------------------------------------------------
  // Console message parser — receives YT_* prefixed logs from HTML
  // ---------------------------------------------------------------------------
  void _handleConsoleMessage(String message) {
    if (message == 'YT_READY') {
      setState(() => _isReady = true);
      _jsListen();
      _startTimePoller();
      // Auto-play on ready
      Future.delayed(const Duration(milliseconds: 500), _jsPlay);
      return;
    }
    if (message.startsWith('YT_STATE:')) {
      final stateStr = message.substring('YT_STATE:'.length).trim();
      final state = int.tryParse(stateStr);
      // YT states: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
      if (state == 1) {
        setState(() => _isPlaying = true);
      } else if (state == 2 || state == 0) {
        setState(() => _isPlaying = false);
      }
      return;
    }
    if (message.startsWith('YT_TIME:')) {
      final t = double.tryParse(message.substring('YT_TIME:'.length).trim());
      if (t != null && mounted) setState(() => _currentTime = t);
      return;
    }
    if (message.startsWith('YT_DUR:')) {
      final d = double.tryParse(message.substring('YT_DUR:'.length).trim());
      if (d != null && d > 0 && mounted) setState(() => _duration = d);
    }
  }

  // ---------------------------------------------------------------------------
  // Periodic time polling (every 500ms)
  // ---------------------------------------------------------------------------
  void _startTimePoller() {
    _timePoller?.cancel();
    _timePoller = Timer.periodic(const Duration(milliseconds: 500), (_) async {
      if (!mounted || _webCtrl == null) return;
      await _webCtrl!.evaluateJavascript(
        source: '''
          (function() {
            var p = document.getElementById("player");
            if (!p || !p.contentWindow) return;
            p.contentWindow.postMessage(JSON.stringify({event:"listening"}), "*");
          })();
        ''',
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Fullscreen helpers
  // ---------------------------------------------------------------------------
  void _enterFullscreen() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    setState(() => _isFullscreen = true);
  }

  void _exitFullscreen() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    setState(() => _isFullscreen = false);
  }

  void _toggleFullscreen() {
    if (_isFullscreen) {
      _exitFullscreen();
    } else {
      _enterFullscreen();
    }
    _showControlsTemporarily();
  }

  // ---------------------------------------------------------------------------
  // Build HTML for the white-label player
  // ---------------------------------------------------------------------------
  String _buildHtml(String videoId) {
    return '''<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #000; overflow: hidden; width: 100vw; height: 100vh; touch-action: none; }
.wrapper { position: relative; width: 100%; height: 100%; overflow: hidden; }
iframe {
  position: absolute;
  top: -60px;
  left: 0;
  width: 100%;
  height: calc(100% + 120px);
  border: none;
  pointer-events: none;
}
</style>
</head>
<body>
<div class="wrapper">
<iframe id="player"
  src="https://www.youtube-nocookie.com/embed/$videoId?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&playsinline=1&showinfo=0&origin=https://alledu.app"
  allow="autoplay; encrypted-media"
  allowfullscreen>
</iframe>
</div>
<script>
window.addEventListener('message', function(e) {
  if (typeof e.data !== 'string') return;
  try {
    var d = JSON.parse(e.data);
    if (d.event === 'onReady') {
      console.log('YT_READY');
      document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'listening'}), '*');
    }
    if (d.event === 'onStateChange') {
      console.log('YT_STATE:' + d.info);
    }
    if (d.event === 'infoDelivery' && d.info) {
      if (d.info.currentTime !== undefined) console.log('YT_TIME:' + d.info.currentTime);
      if (d.info.duration !== undefined) console.log('YT_DUR:' + d.info.duration);
    }
  } catch(err) {}
});

function ytPlay()   { document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'command',func:'playVideo',args:[]}), '*'); }
function ytPause()  { document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}), '*'); }
function ytSeek(t)  { document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'command',func:'seekTo',args:[t,true]}), '*'); }
function ytUnmute() {
  document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'command',func:'unMute',args:[]}), '*');
  document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'command',func:'setVolume',args:[100]}), '*');
}
function ytSpeed(s) { document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'command',func:'setPlaybackRate',args:[s]}), '*'); }
function ytListen() { document.getElementById('player').contentWindow.postMessage(JSON.stringify({event:'listening'}), '*'); }
</script>
</body>
</html>''';
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    // Loading state
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Column(
          children: [
            AppBar(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios, size: 20),
                onPressed: () => context.pop(),
              ),
              title: const Text('Loading...', style: TextStyle(fontSize: 16)),
            ),
            const Expanded(
              child: Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            ),
          ],
        ),
      );
    }

    // Error state
    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios, color: AppTheme.textPrimary, size: 20),
            onPressed: () => context.pop(),
          ),
          title: const Text('Live Class', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, color: Colors.redAccent, size: 56),
                const SizedBox(height: 16),
                Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: AppTheme.textSecondary)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _fetchLiveClass,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final liveClass = _liveClass!;
    final videoId = liveClass.youtubeVideoId ?? '';

    if (_isFullscreen) {
      return WillPopScope(
        onWillPop: () async {
          _exitFullscreen();
          return false;
        },
        child: Scaffold(
          backgroundColor: Colors.black,
          body: _buildPlayerStack(videoId, liveClass),
        ),
      );
    }

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
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Player (16:9 aspect ratio) ──────────────────────────────────
          AspectRatio(
            aspectRatio: 16 / 9,
            child: _buildPlayerStack(videoId, liveClass),
          ),

          // ── Live class info ─────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.redAccent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        liveClass.title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (liveClass.description != null && liveClass.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    liveClass.description!,
                    style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary, height: 1.4),
                  ),
                ],
              ],
            ),
          ),

          const Divider(height: 1),

          // ── Chat section ────────────────────────────────────────────────
          Expanded(child: _buildChatSection()),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Player stack: WebView + overlay controls
  // ---------------------------------------------------------------------------
  Widget _buildPlayerStack(String videoId, LiveClass liveClass) {
    if (videoId.isEmpty) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.videocam_off, color: Colors.white54, size: 48),
              SizedBox(height: 12),
              Text('No video available', style: TextStyle(color: Colors.white54)),
            ],
          ),
        ),
      );
    }

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _showControlsTemporarily,
      child: Stack(
        children: [
          // ── InAppWebView ──────────────────────────────────────────────
          InAppWebView(
            initialData: InAppWebViewInitialData(
              data: _buildHtml(videoId),
              mimeType: 'text/html',
              encoding: 'utf-8',
              baseUrl: WebUri('https://alledu.app'),
            ),
            initialSettings: InAppWebViewSettings(
              mediaPlaybackRequiresUserGesture: false,
              allowsInlineMediaPlayback: true,
              transparentBackground: true,
              disableHorizontalScroll: true,
              disableVerticalScroll: true,
              supportZoom: false,
              javaScriptEnabled: true,
              mixedContentMode: MixedContentMode.MIXED_CONTENT_ALWAYS_ALLOW,
            ),
            onWebViewCreated: (ctrl) {
              _webCtrl = ctrl;
            },
            onConsoleMessage: (ctrl, msg) {
              _handleConsoleMessage(msg.message);
            },
          ),

          // ── Watermark overlay ────────────────────────────────────────
          Positioned(
            top: 10,
            right: 12,
            child: IgnorePointer(
              child: Opacity(
                opacity: 0.35,
                child: Text(
                  'alledu',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.5,
                    shadows: [Shadow(blurRadius: 4, color: Colors.black.withOpacity(0.7))],
                  ),
                ),
              ),
            ),
          ),

          // ── Loading indicator (before player is ready) ───────────────
          if (!_isReady)
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),

          // ── Custom controls overlay ──────────────────────────────────
          AnimatedOpacity(
            opacity: _showControls ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 300),
            child: IgnorePointer(
              ignoring: !_showControls,
              child: _buildControlsOverlay(),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Custom controls overlay
  // ---------------------------------------------------------------------------
  Widget _buildControlsOverlay() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xAA000000),
            Color(0x00000000),
            Color(0x00000000),
            Color(0xBB000000),
          ],
          stops: [0.0, 0.25, 0.75, 1.0],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // ── Seek bar ────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                trackHeight: 2.5,
                activeTrackColor: AppTheme.primary,
                inactiveTrackColor: Colors.white38,
                thumbColor: Colors.white,
                overlayColor: Colors.white24,
              ),
              child: Slider(
                value: (_duration > 0) ? _currentTime.clamp(0, _duration) : 0,
                min: 0,
                max: _duration > 0 ? _duration : 1,
                onChangeStart: (_) => _cancelAutoHide(),
                onChanged: (v) => setState(() => _currentTime = v),
                onChangeEnd: (v) {
                  _jsSeek(v);
                  _showControlsTemporarily();
                },
              ),
            ),
          ),

          // ── Bottom row ───────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
            child: Row(
              children: [
                // Play / Pause
                IconButton(
                  icon: Icon(
                    _isPlaying ? Icons.pause : Icons.play_arrow,
                    color: Colors.white,
                    size: 28,
                  ),
                  onPressed: () {
                    _isPlaying ? _jsPause() : _jsPlay();
                    _showControlsTemporarily();
                  },
                ),

                // Mute/Unmute
                IconButton(
                  icon: Icon(
                    _isMuted ? Icons.volume_off : Icons.volume_up,
                    color: Colors.white,
                    size: 22,
                  ),
                  onPressed: () async {
                    if (_isMuted) {
                      await _jsUnmute();
                    } else {
                      await _webCtrl?.evaluateJavascript(
                        source: 'document.getElementById("player").contentWindow.postMessage(JSON.stringify({event:"command",func:"mute",args:[]}), "*");',
                      );
                      setState(() => _isMuted = true);
                    }
                    _showControlsTemporarily();
                  },
                ),

                // Time display
                Text(
                  '${_formatTime(_currentTime)} / ${_formatTime(_duration)}',
                  style: const TextStyle(color: Colors.white, fontSize: 11),
                ),

                const Spacer(),

                // Speed selector
                GestureDetector(
                  onTap: () {
                    _cancelAutoHide();
                    _showSpeedDialog();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white54),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${_playbackSpeed == _playbackSpeed.truncateToDouble() ? _playbackSpeed.toInt() : _playbackSpeed}x',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),

                const SizedBox(width: 4),

                // Fullscreen
                IconButton(
                  icon: Icon(
                    _isFullscreen ? Icons.fullscreen_exit : Icons.fullscreen,
                    color: Colors.white,
                    size: 24,
                  ),
                  onPressed: _toggleFullscreen,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Speed picker dialog
  // ---------------------------------------------------------------------------
  void _showSpeedDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1C1C1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Playback Speed',
                    style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
                ..._speeds.map((s) {
                  final selected = s == _playbackSpeed;
                  return ListTile(
                    dense: true,
                    title: Text(
                      '${s == s.truncateToDouble() ? s.toInt() : s}x',
                      style: TextStyle(
                        color: selected ? AppTheme.primary : Colors.white,
                        fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    trailing: selected ? const Icon(Icons.check, color: AppTheme.primary, size: 18) : null,
                    onTap: () {
                      _jsSpeed(s);
                      Navigator.pop(context);
                      _showControlsTemporarily();
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Chat section
  // ---------------------------------------------------------------------------
  Widget _buildChatSection() {
    return Container(
      color: Colors.grey.shade50,
      child: Column(
        children: [
          // Header
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

          // Messages
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
    );
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------
  String _formatTime(double seconds) {
    if (seconds.isNaN || seconds.isInfinite) return '0:00';
    final total = seconds.toInt();
    final h = total ~/ 3600;
    final m = (total % 3600) ~/ 60;
    final s = total % 60;
    if (h > 0) {
      return '$h:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
