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
  bool _isMuted = true;
  double _currentTime = 0;
  double _duration = 0;
  double _playbackSpeed = 1.0;
  bool _isReady = false;

  // ---- UI state ------------------------------------------------------------
  bool _showControls = true;
  bool _isFullscreen = false;
  Timer? _hideControlsTimer;
  Timer? _timePoller;
  Timer? _countdownTimer;
  Duration _remaining = Duration.zero;

  // ---- Chat state ----------------------------------------------------------
  final _chatController = TextEditingController();
  final List<String> _chatMessages = [
    'Welcome to the live session! Feel free to ask questions here.',
    'Sir, please explain the last step again.',
    'Got it! Thank you sir!',
    'Is the PDF uploaded for this chapter?',
  ];

  // ---- Notes state (for recorded classes) ----------------------------------
  final _notesController = TextEditingController();
  final List<String> _savedNotes = [];

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
    _countdownTimer?.cancel();
    _chatController.dispose();
    _notesController.dispose();
    if (_isFullscreen) _exitFullscreen();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // API — improved with data-wrapper handling
  // ---------------------------------------------------------------------------
  Future<void> _fetchLiveClass() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await _apiClient.get('/live-classes/${widget.classId}');
      final raw = res.data;
      Map<String, dynamic> data;
      if (raw is Map && raw.containsKey('data')) {
        data = raw['data'] as Map<String, dynamic>;
      } else if (raw is Map) {
        data = Map<String, dynamic>.from(raw);
      } else {
        throw Exception('Invalid response format');
      }
      final liveClass = LiveClass.fromJson(data);
      setState(() {
        _liveClass = liveClass;
        _isLoading = false;
      });
      _startCountdownIfNeeded(liveClass);
    } catch (e) {
      setState(() {
        _error = 'Failed to load live class.\n\nID: ${widget.classId}\nError: ${e.toString().length > 200 ? e.toString().substring(0, 200) : e.toString()}';
        _isLoading = false;
      });
    }
  }

  void _startCountdownIfNeeded(LiveClass liveClass) {
    if (liveClass.status == 'approved' || liveClass.status == 'scheduled') {
      _updateRemaining(liveClass);
      _countdownTimer = Timer.periodic(
        const Duration(seconds: 1),
        (_) => _updateRemaining(liveClass),
      );
    }
  }

  void _updateRemaining(LiveClass liveClass) {
    try {
      final scheduledAt = DateTime.parse(liveClass.scheduledAt).toLocal();
      final diff = scheduledAt.difference(DateTime.now());
      if (mounted) {
        setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
      }
    } catch (_) {}
  }

  String _formatCountdown(Duration d) {
    final days = d.inDays;
    final h = d.inHours.remainder(24).toString().padLeft(2, '0');
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (days > 0) return '${days}d ${h}h ${m}m ${s}s';
    return '$h:$m:$s';
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

  void _cancelAutoHide() => _hideControlsTimer?.cancel();

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
  // Console message parser
  // ---------------------------------------------------------------------------
  void _handleConsoleMessage(String message) {
    if (message == 'YT_READY') {
      setState(() => _isReady = true);
      _jsListen();
      _startTimePoller();
      Future.delayed(const Duration(milliseconds: 500), _jsPlay);
      return;
    }
    if (message.startsWith('YT_STATE:')) {
      final state = int.tryParse(message.substring('YT_STATE:'.length).trim());
      if (state == 1) setState(() => _isPlaying = true);
      else if (state == 2 || state == 0) setState(() => _isPlaying = false);
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

  void _startTimePoller() {
    _timePoller?.cancel();
    _timePoller = Timer.periodic(const Duration(milliseconds: 500), (_) async {
      if (!mounted || _webCtrl == null) return;
      await _webCtrl!.evaluateJavascript(source: '''
        (function() {
          var p = document.getElementById("player");
          if (!p || !p.contentWindow) return;
          p.contentWindow.postMessage(JSON.stringify({event:"listening"}), "*");
        })();
      ''');
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
    _isFullscreen ? _exitFullscreen() : _enterFullscreen();
    _showControlsTemporarily();
  }

  // ---------------------------------------------------------------------------
  // HTML builders
  // ---------------------------------------------------------------------------
  String _buildLiveHtml(String videoId) {
    return '''<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#000;overflow:hidden;width:100vw;height:100vh;}
#wrap{position:absolute;inset:0;overflow:hidden;background:#000;}
#player{position:absolute;top:-70px;left:-4px;width:calc(100% + 8px);height:calc(100% + 150px);border:none;pointer-events:none;}
#blk-top{position:absolute;top:0;left:0;right:0;height:72px;background:#000;z-index:5;}
#blk-bot{position:absolute;bottom:0;left:0;right:0;height:82px;background:#000;z-index:5;}
#cover{display:none;position:absolute;inset:0;background:#000;z-index:20;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
#cover-text{color:#fff;font-size:16px;font-family:sans-serif;}
#replay-btn{background:#1a56db;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:15px;font-family:sans-serif;cursor:pointer;}
</style>
</head>
<body>
<div id="wrap">
  <div id="blk-top"></div>
  <iframe id="player"
    src="https://www.youtube-nocookie.com/embed/$videoId?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&playsinline=1&showinfo=0&origin=https://alledu.app"
    allow="autoplay; encrypted-media; fullscreen" allowfullscreen>
  </iframe>
  <div id="blk-bot"></div>
  <div id="cover">
    <div id="cover-text">Video ended</div>
    <button id="replay-btn" onclick="doReplay()">Watch Again</button>
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
function doReplay(){document.getElementById('cover').style.display='none';ytSeek(0);ytPlay();}
window.addEventListener('message',function(e){
  if(typeof e.data!=='string')return;
  try{
    var d=JSON.parse(e.data);
    if(d.event==='onReady'){ready=true;console.log('YT_READY');ytListen();}
    if(d.event==='onStateChange'){
      console.log('YT_STATE:'+d.info);
      if(d.info===0){document.getElementById('cover').style.display='flex';}
      else if(d.info===1){document.getElementById('cover').style.display='none';}
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

  String _buildRecordingHtml(String videoId) {
    // Recording: no autoplay, mute=0, standard controls hidden but JS-controlled
    return '''<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#000;overflow:hidden;width:100vw;height:100vh;}
#wrap{position:absolute;inset:0;overflow:hidden;background:#000;}
#player{position:absolute;top:-70px;left:-4px;width:calc(100% + 8px);height:calc(100% + 150px);border:none;pointer-events:none;}
#blk-top{position:absolute;top:0;left:0;right:0;height:72px;background:#000;z-index:5;}
#blk-bot{position:absolute;bottom:0;left:0;right:0;height:82px;background:#000;z-index:5;}
#cover{display:none;position:absolute;inset:0;background:#000;z-index:20;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
#cover-text{color:#fff;font-size:16px;font-family:sans-serif;}
#replay-btn{background:#1a56db;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:15px;font-family:sans-serif;cursor:pointer;}
</style>
</head>
<body>
<div id="wrap">
  <div id="blk-top"></div>
  <iframe id="player"
    src="https://www.youtube-nocookie.com/embed/$videoId?autoplay=0&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&playsinline=1&showinfo=0&origin=https://alledu.app"
    allow="autoplay; encrypted-media; fullscreen" allowfullscreen>
  </iframe>
  <div id="blk-bot"></div>
  <div id="cover">
    <div id="cover-text">Video ended</div>
    <button id="replay-btn" onclick="doReplay()">Watch Again</button>
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
function doReplay(){document.getElementById('cover').style.display='none';ytSeek(0);ytPlay();}
window.addEventListener('message',function(e){
  if(typeof e.data!=='string')return;
  try{
    var d=JSON.parse(e.data);
    if(d.event==='onReady'){ready=true;console.log('YT_READY');ytListen();}
    if(d.event==='onStateChange'){
      console.log('YT_STATE:'+d.info);
      if(d.info===0){document.getElementById('cover').style.display='flex';}
      else if(d.info===1){document.getElementById('cover').style.display='none';}
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
  // Build — routes to live / recording / upcoming views
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
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
            const Expanded(child: Center(child: CircularProgressIndicator(color: AppTheme.primary))),
          ],
        ),
      );
    }

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

    // Route to appropriate view based on status
    if (liveClass.status == 'approved' || liveClass.status == 'scheduled') {
      return _buildUpcomingView(liveClass);
    } else if (liveClass.status == 'ended') {
      return _buildRecordingView(liveClass);
    } else {
      // status == 'active' or fallback
      return _buildLiveView(liveClass);
    }
  }

  // ---------------------------------------------------------------------------
  // UPCOMING / WAITING VIEW
  // ---------------------------------------------------------------------------
  Widget _buildUpcomingView(LiveClass liveClass) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          liveClass.title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text('UPCOMING', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('📡', style: TextStyle(fontSize: 64)),
              const SizedBox(height: 24),
              const Text(
                'Class starts in',
                style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.07),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.12)),
                ),
                child: Text(
                  _remaining > Duration.zero ? _formatCountdown(_remaining) : 'Starting soon...',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                    fontFeatures: [FontFeature.tabularFigures()],
                    letterSpacing: 2,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.calendar_today_outlined, color: Colors.white54, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    '${_formatDate(liveClass.scheduledAt)} at ${_formatTime(liveClass.scheduledAt)}',
                    style: const TextStyle(color: Colors.white54, fontSize: 13),
                  ),
                ],
              ),
              if (liveClass.description != null && liveClass.description!.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text(
                  liveClass.description!,
                  style: const TextStyle(color: Colors.white38, fontSize: 13, height: 1.5),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 32),
              OutlinedButton.icon(
                onPressed: _fetchLiveClass,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Colors.white24),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Refresh Status'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${d.day} ${months[d.month - 1]} ${d.year}';
    } catch (_) { return ''; }
  }

  String _formatTime(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      final h = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
      final m = d.minute.toString().padLeft(2, '0');
      final ampm = d.hour >= 12 ? 'PM' : 'AM';
      return '$h:$m $ampm';
    } catch (_) { return ''; }
  }

  // ---------------------------------------------------------------------------
  // LIVE VIEW (status == 'active')
  // ---------------------------------------------------------------------------
  Widget _buildLiveView(LiveClass liveClass) {
    final videoId = liveClass.youtubeVideoId ?? '';

    if (_isFullscreen) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) { if (!didPop) _exitFullscreen(); },
        child: Scaffold(
          backgroundColor: Colors.black,
          body: _buildPlayerStack(videoId, isLive: true),
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
          AspectRatio(
            aspectRatio: 16 / 9,
            child: _buildPlayerStack(videoId, isLive: true),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(6)),
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
                    Row(
                      children: [
                        const Icon(Icons.remove_red_eye_outlined, size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 4),
                        Text('—', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                      ],
                    ),
                  ],
                ),
                if (liveClass.description != null && liveClass.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(liveClass.description!, style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary, height: 1.4)),
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(child: _buildChatSection()),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // RECORDING VIEW (status == 'ended')
  // ---------------------------------------------------------------------------
  Widget _buildRecordingView(LiveClass liveClass) {
    final videoId = liveClass.youtubeVideoId ?? '';

    if (_isFullscreen) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) { if (!didPop) _exitFullscreen(); },
        child: Scaffold(
          backgroundColor: Colors.black,
          body: _buildPlayerStack(videoId, isLive: false),
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
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(6)),
            child: const Text('RECORDING', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: _buildPlayerStack(videoId, isLive: false),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(6)),
                      child: const Text('RECORDING', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(liveClass.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary), overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
                if (liveClass.description != null && liveClass.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(liveClass.description!, style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary, height: 1.4)),
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(child: _buildNotesSection()),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Player stack: WebView + overlay controls
  // ---------------------------------------------------------------------------
  Widget _buildPlayerStack(String videoId, {required bool isLive}) {
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

    return Stack(
      fit: StackFit.expand,
      children: [
        // WebView
        InAppWebView(
          initialData: InAppWebViewInitialData(
            data: isLive ? _buildLiveHtml(videoId) : _buildRecordingHtml(videoId),
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
          onConsoleMessage: (ctrl, msg) => _handleConsoleMessage(msg.message),
        ),
        // Transparent tap-catcher to toggle controls
        Positioned.fill(
          child: GestureDetector(
            behavior: HitTestBehavior.translucent,
            onTap: _showControlsTemporarily,
            child: const ColoredBox(color: Colors.transparent),
          ),
        ),
        // Watermark
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
        // Loading indicator
        if (!_isReady)
          const Center(child: CircularProgressIndicator(color: Colors.white)),
        // Mute banner (live only)
        if (isLive && _isMuted && _isReady)
          Positioned(
            bottom: 56,
            left: 0,
            right: 0,
            child: GestureDetector(
              onTap: _jsUnmute,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.volume_off, color: Colors.white, size: 16),
                      SizedBox(width: 6),
                      Text('Tap to unmute', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        // Custom controls overlay — IgnorePointer properly tied to visibility
        Positioned.fill(
          child: AnimatedOpacity(
            opacity: _showControls ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 300),
            child: IgnorePointer(
              ignoring: !_showControls,
              child: _buildControlsOverlay(),
            ),
          ),
        ),
      ],
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
          colors: [Color(0xAA000000), Color(0x00000000), Color(0x00000000), Color(0xBB000000)],
          stops: [0.0, 0.25, 0.75, 1.0],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
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
                onChangeEnd: (v) { _jsSeek(v); _showControlsTemporarily(); },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 6),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow, color: Colors.white, size: 28),
                  onPressed: () { _isPlaying ? _jsPause() : _jsPlay(); _showControlsTemporarily(); },
                ),
                IconButton(
                  icon: Icon(_isMuted ? Icons.volume_off : Icons.volume_up, color: Colors.white, size: 22),
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
                Text(
                  '${_formatPlayerTime(_currentTime)} / ${_formatPlayerTime(_duration)}',
                  style: const TextStyle(color: Colors.white, fontSize: 11),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () { _cancelAutoHide(); _showSpeedDialog(); },
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
                IconButton(
                  icon: Icon(_isFullscreen ? Icons.fullscreen_exit : Icons.fullscreen, color: Colors.white, size: 24),
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
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) {
        return SafeArea(
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
                  final selected = s == _playbackSpeed;
                  return ListTile(
                    dense: true,
                    title: Text(
                      '${s == s.truncateToDouble() ? s.toInt() : s}x',
                      style: TextStyle(color: selected ? AppTheme.primary : Colors.white, fontWeight: selected ? FontWeight.bold : FontWeight.normal),
                    ),
                    trailing: selected ? const Icon(Icons.check, color: AppTheme.primary, size: 18) : null,
                    onTap: () { _jsSpeed(s); Navigator.pop(context); _showControlsTemporarily(); },
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
  // Chat section (live classes) — real scrollable chat with input
  // ---------------------------------------------------------------------------
  Widget _buildChatSection() {
    final ScrollController scrollCtrl = ScrollController();

    return Container(
      color: Colors.grey.shade50,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: Row(
              children: [
                Container(
                  width: 8, height: 8,
                  decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
                const Text('Live Chat', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                const Spacer(),
                Text('${_chatMessages.length} messages', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ],
            ),
          ),
          // Messages list
          Expanded(
            child: ListView.builder(
              controller: scrollCtrl,
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
              itemCount: _chatMessages.length,
              itemBuilder: (context, index) {
                final msg = _chatMessages[index];
                // Determine if it's the user's own message (last one added by user)
                final isOwnMsg = index == _chatMessages.length - 1 && _chatMessages.length > 4;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: isOwnMsg ? MainAxisAlignment.end : MainAxisAlignment.start,
                    children: [
                      if (!isOwnMsg) ...[
                        CircleAvatar(
                          radius: 13,
                          backgroundColor: AppTheme.primary.withOpacity(0.12),
                          child: Text(
                            _getChatAvatar(index),
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primary),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Column(
                          crossAxisAlignment: isOwnMsg ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                          children: [
                            if (!isOwnMsg)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 3, left: 2),
                                child: Text(
                                  _getChatSender(index),
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                                ),
                              ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: isOwnMsg ? AppTheme.primary : Colors.white,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(12),
                                  topRight: const Radius.circular(12),
                                  bottomLeft: Radius.circular(isOwnMsg ? 12 : 2),
                                  bottomRight: Radius.circular(isOwnMsg ? 2 : 12),
                                ),
                                border: isOwnMsg ? null : Border.all(color: AppTheme.border),
                              ),
                              child: Text(
                                msg,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isOwnMsg ? Colors.white : AppTheme.textPrimary,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isOwnMsg) ...[
                        const SizedBox(width: 8),
                        const CircleAvatar(
                          radius: 13,
                          backgroundColor: AppTheme.primary,
                          child: Text('Me', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),
          // Input area
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _chatController,
                    style: const TextStyle(fontSize: 13),
                    textInputAction: TextInputAction.send,
                    onSubmitted: (text) => _sendChat(text, scrollCtrl),
                    decoration: InputDecoration(
                      hintText: 'Ask a question...',
                      hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: Colors.grey.shade200),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: Colors.grey.shade200),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _sendChat(_chatController.text, scrollCtrl),
                  child: Container(
                    width: 40, height: 40,
                    decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                    child: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _sendChat(String text, ScrollController scrollCtrl) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    setState(() {
      _chatMessages.add(trimmed);
      _chatController.clear();
    });
    // Auto-scroll to bottom after a short delay
    Future.delayed(const Duration(milliseconds: 100), () {
      if (scrollCtrl.hasClients) {
        scrollCtrl.animateTo(
          scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _getChatAvatar(int index) {
    const avatars = ['A', 'B', 'R', 'S', 'M', 'K', 'P', 'D'];
    return avatars[index % avatars.length];
  }

  String _getChatSender(int index) {
    const senders = ['Aryan S.', 'Bhumi R.', 'Ravi K.', 'Sneha P.', 'Mohan T.', 'Kavya N.', 'Priya M.', 'Dev A.'];
    return senders[index % senders.length];
  }

  // ---------------------------------------------------------------------------
  // Notes section (recorded classes)
  // ---------------------------------------------------------------------------
  Widget _buildNotesSection() {
    return Container(
      color: Colors.grey.shade50,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: const Row(
              children: [
                Icon(Icons.edit_note, size: 18, color: AppTheme.textSecondary),
                SizedBox(width: 8),
                Text('Personal Notes', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
              ],
            ),
          ),
          Expanded(
            child: _savedNotes.isEmpty
                ? Center(
                    child: Text(
                      'Add your notes below',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _savedNotes.length,
                    itemBuilder: (context, index) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.sticky_note_2_outlined, size: 14, color: AppTheme.primary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_savedNotes[index], style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary, height: 1.4)),
                            ),
                            GestureDetector(
                              onTap: () => setState(() => _savedNotes.removeAt(index)),
                              child: const Icon(Icons.close, size: 14, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _notesController,
                    maxLines: 2,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Write a note...',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      fillColor: Colors.grey.shade50,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.save_outlined, color: AppTheme.primary, size: 22),
                  onPressed: () {
                    final text = _notesController.text.trim();
                    if (text.isNotEmpty) {
                      setState(() { _savedNotes.add(text); _notesController.clear(); });
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
  String _formatPlayerTime(double seconds) {
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
