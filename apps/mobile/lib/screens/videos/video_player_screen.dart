import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:alledu_mobile/config/theme.dart';

// ---------------------------------------------------------------------------
// Video detail model
// ---------------------------------------------------------------------------
class _VideoDetail {
  final String id;
  final String title;
  final String youtubeVideoId;
  final int durationSeconds;
  final String? batchTitle;
  final String? chapterTitle;
  final String? description;

  const _VideoDetail({
    required this.id,
    required this.title,
    required this.youtubeVideoId,
    required this.durationSeconds,
    this.batchTitle,
    this.chapterTitle,
    this.description,
  });

  factory _VideoDetail.fromJson(Map<String, dynamic> json) {
    return _VideoDetail(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      youtubeVideoId: (json['youtubeVideoId'] ?? json['youtube_video_id'] ?? '').toString(),
      durationSeconds: ((json['durationSeconds'] ?? json['duration_seconds'] ?? 0) as num).toInt(),
      batchTitle: json['batchTitle']?.toString() ?? (json['batch'] as Map?)?['name']?.toString(),
      chapterTitle: json['chapterTitle']?.toString() ?? (json['chapter'] as Map?)?['name']?.toString(),
      description: json['description']?.toString(),
    );
  }
}

// ---------------------------------------------------------------------------
// Expandable description text widget
// ---------------------------------------------------------------------------
class _ExpandableText extends StatefulWidget {
  final String text;
  const _ExpandableText({required this.text});

  @override
  State<_ExpandableText> createState() => _ExpandableTextState();
}

class _ExpandableTextState extends State<_ExpandableText> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AnimatedCrossFade(
          firstChild: Text(
            widget.text,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.45),
          ),
          secondChild: Text(
            widget.text,
            style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.45),
          ),
          crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
        const SizedBox(height: 4),
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Text(
            _expanded ? 'See less' : 'See more',
            style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
class VideoPlayerScreen extends StatefulWidget {
  final String videoId;
  const VideoPlayerScreen({super.key, required this.videoId});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  final _api = ApiClient();

  _VideoDetail? _video;
  bool _isLoading = true;
  String? _error;

  // Player state
  InAppWebViewController? _webCtrl;
  bool _isPlaying = false;
  bool _isMuted = false;
  double _currentTime = 0;
  double _duration = 0;
  double _playbackSpeed = 1.0;
  bool _isReady = false;
  bool _showControls = true;
  bool _isFullscreen = false;

  Timer? _hideControlsTimer;
  Timer? _timePoller;

  // Notes
  final _notesCtrl = TextEditingController();
  final List<String> _notes = [];

  static const List<double> _speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  @override
  void initState() {
    super.initState();
    _fetchVideo();
  }

  @override
  void dispose() {
    _hideControlsTimer?.cancel();
    _timePoller?.cancel();
    _notesCtrl.dispose();
    if (_isFullscreen) _exitFullscreen();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // API — try /videos first, fallback to /live-classes
  // ---------------------------------------------------------------------------
  Future<void> _fetchVideo() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      var res;
      bool isLiveClass = false;

      try {
        res = await _api.get('/videos/${widget.videoId}');
      } catch (videoErr) {
        try {
          res = await _api.get('/live-classes/${widget.videoId}');
          isLiveClass = true;
        } catch (_) {
          rethrow;
        }
      }

      final raw = res.data;
      Map<String, dynamic> data;
      if (raw is Map && raw.containsKey('data')) {
        data = Map<String, dynamic>.from(raw['data'] as Map);
      } else if (raw is Map) {
        data = Map<String, dynamic>.from(raw);
      } else {
        throw Exception('Invalid response');
      }

      // Last watch position
      double lastPos = 0;
      try {
        final sr = await _api.get('/videos/${widget.videoId}/watch-session');
        final sd = sr.data;
        if (sd is Map) {
          lastPos = ((sd['lastPosition'] ?? sd['last_position'] ?? 0) as num).toDouble();
        }
      } catch (_) {}

      setState(() {
        if (isLiveClass) {
          _video = _VideoDetail.fromJson({
            'id': data['id'],
            'title': data['title'],
            'youtubeVideoId': data['youtube_video_id'] ?? data['youtubeVideoId'] ?? '',
            'durationSeconds': 0,
            'description': data['description'],
          });
        } else {
          _video = _VideoDetail.fromJson(data);
        }
        _currentTime = lastPos;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load video.\n\nError: ${e.toString().length > 200 ? e.toString().substring(0, 200) : e.toString()}';
        _isLoading = false;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Controls visibility
  // ---------------------------------------------------------------------------
  void _showControlsTemp() {
    setState(() => _showControls = true);
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showControls = false);
    });
  }

  // ---------------------------------------------------------------------------
  // JS bridge
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

  Future<void> _jsSeek(double s) async {
    await _webCtrl?.evaluateJavascript(source: 'ytSeek($s)');
    setState(() => _currentTime = s);
  }

  Future<void> _jsUnmute() async {
    await _webCtrl?.evaluateJavascript(source: 'ytUnmute()');
    setState(() => _isMuted = false);
  }

  Future<void> _jsSpeed(double s) async {
    await _webCtrl?.evaluateJavascript(source: 'ytSpeed($s)');
    setState(() => _playbackSpeed = s);
  }

  // ---------------------------------------------------------------------------
  // Console message handler
  // ---------------------------------------------------------------------------
  void _handleConsole(String msg) {
    if (msg == 'YT_READY') {
      setState(() => _isReady = true);
      _webCtrl?.evaluateJavascript(source: 'ytListen()');
      _startPoller();
      if (_currentTime > 0) {
        Future.delayed(const Duration(milliseconds: 600), () {
          _webCtrl?.evaluateJavascript(source: 'ytSeek($_currentTime)');
        });
      }
      return;
    }
    if (msg.startsWith('YT_STATE:')) {
      final s = int.tryParse(msg.substring(9).trim());
      if (s == 1) setState(() => _isPlaying = true);
      else if (s == 2 || s == 0) setState(() => _isPlaying = false);
      return;
    }
    if (msg.startsWith('YT_TIME:')) {
      final t = double.tryParse(msg.substring(8).trim());
      if (t != null && mounted) {
        setState(() => _currentTime = t);
        if (t % 10 < 0.6) _saveProgress(t);
      }
      return;
    }
    if (msg.startsWith('YT_DUR:')) {
      final d = double.tryParse(msg.substring(7).trim());
      if (d != null && d > 0 && mounted) setState(() => _duration = d);
    }
  }

  void _startPoller() {
    _timePoller?.cancel();
    _timePoller = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (!mounted || _webCtrl == null) return;
      _webCtrl!.evaluateJavascript(source: 'ytListen()');
    });
  }

  Future<void> _saveProgress(double pos) async {
    try {
      await _api.post('/videos/${widget.videoId}/watch-session', data: {
        'watchTimeSecs': 10,
        'watch_time_secs': 10,
        'lastPosition': pos.toInt(),
        'last_position': pos.toInt(),
      });
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Fullscreen
  // ---------------------------------------------------------------------------
  void _enterFullscreen() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    setState(() => _isFullscreen = true);
  }

  void _exitFullscreen() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    setState(() => _isFullscreen = false);
  }

  // ---------------------------------------------------------------------------
  // HTML — aggressive cropping: top -70px, height calc(100% + 150px)
  // black divs cover top 72px and bottom 82px
  // ---------------------------------------------------------------------------
  String _buildHtml(String videoId, {double startAt = 0}) {
    final startParam = startAt > 0 ? '&start=${startAt.toInt()}' : '';
    return '''<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#000;overflow:hidden;width:100vw;height:100vh;}
#wrap{position:absolute;inset:0;overflow:hidden;background:#000;}
#player{
  position:absolute;
  top:-70px;
  left:-4px;
  width:calc(100% + 8px);
  height:calc(100% + 150px);
  border:none;
  pointer-events:none;
}
#blk-top{position:absolute;top:0;left:0;right:0;height:72px;background:#000;z-index:5;}
#blk-bot{position:absolute;bottom:0;left:0;right:0;height:82px;background:#000;z-index:5;}
#end{display:none;position:absolute;inset:0;background:#000;z-index:20;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
#end-icon{font-size:48px;}
#end-msg{color:#fff;font-size:16px;font-family:sans-serif;}
#replay{background:#1a56db;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:15px;font-family:sans-serif;cursor:pointer;font-weight:bold;}
</style>
</head>
<body>
<div id="wrap">
  <div id="blk-top"></div>
  <iframe id="player"
    src="https://www.youtube.com/embed/$videoId?autoplay=0&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&playsinline=1&showinfo=0&color=white$startParam"
    allow="autoplay; encrypted-media; fullscreen" allowfullscreen>
  </iframe>
  <div id="blk-bot"></div>
  <div id="end">
    <div id="end-icon">&#x2705;</div>
    <div id="end-msg">Video completed</div>
    <button id="replay" onclick="doReplay()">Watch Again</button>
  </div>
</div>
<script>
var ready=false;
function send(obj){try{document.getElementById('player').contentWindow.postMessage(JSON.stringify(obj),'*');}catch(e){}}
function ytPlay(){send({event:'command',func:'playVideo',args:[]});}
function ytPause(){send({event:'command',func:'pauseVideo',args:[]});}
function ytSeek(t){send({event:'command',func:'seekTo',args:[t,true]});}
function ytUnmute(){send({event:'command',func:'unMute',args:[]});send({event:'command',func:'setVolume',args:[100]});}
function ytSpeed(s){send({event:'command',func:'setPlaybackRate',args:[s]});}
function ytListen(){send({event:'listening'});}
function doReplay(){document.getElementById('end').style.display='none';ytSeek(0);ytPlay();}
window.addEventListener('message',function(e){
  if(typeof e.data!=='string')return;
  try{
    var d=JSON.parse(e.data);
    if(d.event==='onReady'){ready=true;console.log('YT_READY');ytListen();}
    if(d.event==='onStateChange'){
      console.log('YT_STATE:'+d.info);
      if(d.info===0){document.getElementById('end').style.display='flex';}
      else if(d.info===1){document.getElementById('end').style.display='none';}
    }
    if(d.event==='infoDelivery'&&d.info){
      if(typeof d.info.currentTime==='number')console.log('YT_TIME:'+d.info.currentTime);
      if(typeof d.info.duration==='number'&&d.info.duration>0)console.log('YT_DUR:'+d.info.duration);
    }
  }catch(err){}
});
setInterval(function(){if(ready)ytListen();},500);
</script>
</body>
</html>''';
  }

  // ---------------------------------------------------------------------------
  // Format time helper
  // ---------------------------------------------------------------------------
  String _fmt(double s) {
    if (s.isNaN || s.isInfinite) return '0:00';
    final t = s.toInt();
    final h = t ~/ 3600;
    final m = (t % 3600) ~/ 60;
    final sec = t % 60;
    if (h > 0) return '$h:${m.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')}';
    return '$m:${sec.toString().padLeft(2, '0')}';
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20), onPressed: () => context.pop()),
          title: const Text('Loading...'),
        ),
        body: const Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    if (_error != null || _video == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white, elevation: 0,
          foregroundColor: AppTheme.textPrimary,
          leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20), onPressed: () => context.pop()),
          title: const Text('Video', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold)),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, color: Colors.redAccent, size: 56),
                const SizedBox(height: 16),
                Text(_error ?? 'Video not found', textAlign: TextAlign.center,
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                const SizedBox(height: 24),
                ElevatedButton.icon(onPressed: _fetchVideo, icon: const Icon(Icons.refresh), label: const Text('Try Again')),
              ],
            ),
          ),
        ),
      );
    }

    final video = _video!;

    // Fullscreen: body fills entire screen, no AppBar, no bottom nav
    if (_isFullscreen) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (d, _) { if (!d) _exitFullscreen(); },
        child: Scaffold(
          backgroundColor: Colors.black,
          body: SizedBox.expand(child: _buildPlayerStack(video.youtubeVideoId)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios, size: 20), onPressed: () => context.pop()),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(video.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
            if (video.batchTitle != null || video.chapterTitle != null)
              Text(
                [video.batchTitle, video.chapterTitle].where((s) => s != null).join(' › '),
                style: const TextStyle(fontSize: 11, color: Colors.white70),
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: _buildPlayerStack(video.youtubeVideoId),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(video.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  if (video.description != null && video.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    _buildDescription(video.description!),
                  ],
                  const SizedBox(height: 16),
                  // Notes section
                  const Row(
                    children: [
                      Icon(Icons.edit_note, size: 18, color: AppTheme.primary),
                      SizedBox(width: 6),
                      Text('Personal Notes', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _notesCtrl,
                          maxLines: 2,
                          style: const TextStyle(fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Write a note...',
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: () {
                          final t = _notesCtrl.text.trim();
                          if (t.isNotEmpty) setState(() { _notes.add(t); _notesCtrl.clear(); });
                        },
                        icon: const Icon(Icons.save_outlined, color: AppTheme.primary, size: 24),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_notes.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text('No notes yet', style: TextStyle(fontSize: 13, color: Colors.grey.shade400)),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _notes.length,
                      itemBuilder: (context, i) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.sticky_note_2_outlined, size: 14, color: AppTheme.primary),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_notes[i], style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary))),
                            GestureDetector(
                              onTap: () => setState(() => _notes.removeAt(i)),
                              child: const Icon(Icons.close, size: 14, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
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

  Widget _buildDescription(String desc) {
    return _ExpandableText(text: desc);
  }

  // ---------------------------------------------------------------------------
  // Player stack: transparent tap overlay on top for show/hide controls
  // GestureDetector only wraps a thin transparent layer, not the webview itself
  // ---------------------------------------------------------------------------
  Widget _buildPlayerStack(String videoId) {
    if (videoId.isEmpty) {
      return Container(
        color: Colors.black,
        child: const Center(child: Text('No video available', style: TextStyle(color: Colors.white54))),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // WebView — fills entire stack
        InAppWebView(
          initialData: InAppWebViewInitialData(
            data: _buildHtml(videoId, startAt: _currentTime),
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
          onWebViewCreated: (ctrl) => _webCtrl = ctrl,
          onConsoleMessage: (_, msg) => _handleConsole(msg.message),
        ),

        // Transparent tap-catcher to toggle controls (sits above webview)
        Positioned.fill(
          child: GestureDetector(
            behavior: HitTestBehavior.translucent,
            onTap: _showControlsTemp,
            child: const ColoredBox(color: Colors.transparent),
          ),
        ),

        // Watermark
        Positioned(
          top: 8, right: 10,
          child: IgnorePointer(
            child: Opacity(
              opacity: 0.3,
              child: Text('alledu',
                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700,
                  letterSpacing: 1.5, shadows: [Shadow(blurRadius: 4, color: Colors.black.withValues(alpha: 0.8))])),
            ),
          ),
        ),

        // Loading spinner (before ready)
        if (!_isReady)
          const Center(child: CircularProgressIndicator(color: Colors.white)),

        // Controls overlay — absorbs pointer only when visible
        Positioned.fill(
          child: AnimatedOpacity(
            opacity: _showControls ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 300),
            child: IgnorePointer(
              ignoring: !_showControls,
              child: _buildControls(),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Controls overlay widget
  // ---------------------------------------------------------------------------
  Widget _buildControls() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [Color(0xAA000000), Color(0x00000000), Color(0x00000000), Color(0xBB000000)],
          stops: [0.0, 0.25, 0.75, 1.0],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // Seek bar with explicit gesture detection
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {},
            child: Padding(
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
                  value: _duration > 0 ? _currentTime.clamp(0, _duration) : 0,
                  min: 0,
                  max: _duration > 0 ? _duration : 1,
                  onChangeStart: (_) => _hideControlsTimer?.cancel(),
                  onChanged: (v) => setState(() => _currentTime = v),
                  onChangeEnd: (v) { _jsSeek(v); _showControlsTemp(); },
                ),
              ),
            ),
          ),

          // Bottom row of controls
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
            child: Row(
              children: [
                // Play / Pause
                IconButton(
                  icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow, color: Colors.white, size: 28),
                  onPressed: () {
                    _isPlaying ? _jsPause() : _jsPlay();
                    _showControlsTemp();
                  },
                ),
                // Mute
                IconButton(
                  icon: Icon(_isMuted ? Icons.volume_off : Icons.volume_up, color: Colors.white, size: 22),
                  onPressed: () async {
                    if (_isMuted) {
                      await _jsUnmute();
                    } else {
                      await _webCtrl?.evaluateJavascript(
                        source: 'document.getElementById("player").contentWindow.postMessage(JSON.stringify({event:"command",func:"mute",args:[]}),"*");',
                      );
                      setState(() => _isMuted = true);
                    }
                    _showControlsTemp();
                  },
                ),
                // Time display
                Text(
                  '${_fmt(_currentTime)} / ${_fmt(_duration)}',
                  style: const TextStyle(color: Colors.white, fontSize: 11),
                ),
                const Spacer(),
                // Speed selector
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    _hideControlsTimer?.cancel();
                    showModalBottomSheet(
                      context: context,
                      backgroundColor: const Color(0xFF1C1C1E),
                      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
                      builder: (_) => SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(bottom: 12),
                                child: Text('Playback Speed', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                              ),
                              ..._speeds.map((s) {
                                final sel = s == _playbackSpeed;
                                return ListTile(
                                  dense: true,
                                  title: Text(
                                    '${s == s.truncateToDouble() ? s.toInt() : s}x',
                                    style: TextStyle(color: sel ? AppTheme.primary : Colors.white, fontWeight: sel ? FontWeight.bold : FontWeight.normal),
                                  ),
                                  trailing: sel ? const Icon(Icons.check, color: AppTheme.primary, size: 18) : null,
                                  onTap: () { _jsSpeed(s); Navigator.pop(context); _showControlsTemp(); },
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(border: Border.all(color: Colors.white54), borderRadius: BorderRadius.circular(4)),
                    child: Text(
                      '${_playbackSpeed == _playbackSpeed.truncateToDouble() ? _playbackSpeed.toInt() : _playbackSpeed}x',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                // Fullscreen toggle
                IconButton(
                  icon: Icon(_isFullscreen ? Icons.fullscreen_exit : Icons.fullscreen, color: Colors.white, size: 24),
                  onPressed: () {
                    _isFullscreen ? _exitFullscreen() : _enterFullscreen();
                    _showControlsTemp();
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
