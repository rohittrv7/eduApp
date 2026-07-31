class BatchSummary {
  final String id;
  final String name;
  final String slug;
  final String? thumbnail;
  final double price;
  final bool isFree;
  final String? description;
  final String? targetExam;
  final String? language;
  final int? capacity;
  final int? trialDays;
  final String? startDate;
  final String? endDate;

  BatchSummary({
    required this.id,
    required this.name,
    required this.slug,
    this.thumbnail,
    required this.price,
    required this.isFree,
    this.description,
    this.targetExam,
    this.language,
    this.capacity,
    this.trialDays,
    this.startDate,
    this.endDate,
  });

  String get identifier => (slug.isNotEmpty ? slug : id);

  factory BatchSummary.fromJson(Map<String, dynamic> rawJson) {
    final json = (rawJson['batch'] is Map<String, dynamic>)
        ? rawJson['batch'] as Map<String, dynamic>
        : rawJson;
    final priceVal = json['price'];
    final numPrice = (priceVal is num)
        ? priceVal.toDouble()
        : (double.tryParse(priceVal?.toString() ?? '') ?? 0.0);
    return BatchSummary(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['title']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      thumbnail: json['thumbnail']?.toString() ?? json['thumbnail_url']?.toString(),
      price: numPrice,
      isFree: json['is_free'] ?? json['isFree'] ?? (numPrice == 0),
      description: json['description']?.toString(),
      targetExam: json['target_exam']?.toString() ?? json['targetExam']?.toString(),
      language: json['language']?.toString(),
      capacity: (json['capacity'] is num) ? (json['capacity'] as num).toInt() : int.tryParse(json['capacity']?.toString() ?? ''),
      trialDays: (json['trial_days'] is num) ? (json['trial_days'] as num).toInt() : (json['trialDays'] is num ? (json['trialDays'] as num).toInt() : null),
      startDate: json['start_date']?.toString() ?? json['startDate']?.toString(),
      endDate: json['end_date']?.toString() ?? json['endDate']?.toString(),
    );
  }
}

class BatchDetail {
  final String id;
  final String name;
  final String slug;
  final String? thumbnail;
  final double price;
  final bool isFree;
  final String? description;
  final String? targetExam;
  final String? language;
  final int? capacity;
  final int? trialDays;
  final String? startDate;
  final String? endDate;
  final bool isEnrolled;
  final List<Subject> subjects;
  final int progressPercent;

  BatchDetail({
    required this.id,
    required this.name,
    required this.slug,
    this.thumbnail,
    required this.price,
    required this.isFree,
    this.description,
    this.targetExam,
    this.language,
    this.capacity,
    this.trialDays,
    this.startDate,
    this.endDate,
    required this.isEnrolled,
    required this.subjects,
    required this.progressPercent,
  });

  String get identifier => (slug.isNotEmpty ? slug : id);

  factory BatchDetail.fromJson(Map<String, dynamic> rawJson) {
    final json = (rawJson['batch'] is Map<String, dynamic>)
        ? rawJson['batch'] as Map<String, dynamic>
        : rawJson;
    var subs = json['subjects'] as List? ?? [];
    final priceVal = json['price'];
    final numPrice = (priceVal is num)
        ? priceVal.toDouble()
        : (double.tryParse(priceVal?.toString() ?? '') ?? 0.0);
    final progVal = json['progressPercent'] ?? json['progress_percent'];
    final numProg = (progVal is num) ? progVal.toInt() : (int.tryParse(progVal?.toString() ?? '') ?? 0);

    return BatchDetail(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['title']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      thumbnail: json['thumbnail']?.toString() ?? json['thumbnail_url']?.toString(),
      price: numPrice,
      isFree: json['is_free'] ?? json['isFree'] ?? (numPrice == 0),
      description: json['description']?.toString(),
      targetExam: json['target_exam']?.toString() ?? json['targetExam']?.toString(),
      language: json['language']?.toString(),
      capacity: (json['capacity'] is num) ? (json['capacity'] as num).toInt() : int.tryParse(json['capacity']?.toString() ?? ''),
      trialDays: (json['trial_days'] is num) ? (json['trial_days'] as num).toInt() : (json['trialDays'] is num ? (json['trialDays'] as num).toInt() : null),
      startDate: json['start_date']?.toString() ?? json['startDate']?.toString(),
      endDate: json['end_date']?.toString() ?? json['endDate']?.toString(),
      isEnrolled: json['isEnrolled'] ?? json['is_enrolled'] ?? false,
      subjects: subs.map((s) => Subject.fromJson(s as Map<String, dynamic>)).toList(),
      progressPercent: numProg,
    );
  }
}

class Subject {
  final String id;
  final String title;
  final String? name;
  final List<Chapter> chapters;

  Subject({
    required this.id,
    required this.title,
    this.name,
    required this.chapters,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    var chaps = json['chapters'] as List? ?? [];
    return Subject(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['name']?.toString() ?? '',
      name: json['name']?.toString(),
      chapters: chaps.map((c) => Chapter.fromJson(c as Map<String, dynamic>)).toList(),
    );
  }
}

class Chapter {
  final String id;
  final String title;
  final String? name;
  final int order;
  final List<VideoItem> videos;

  Chapter({
    required this.id,
    required this.title,
    this.name,
    required this.order,
    required this.videos,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    var vids = json['videos'] as List? ?? [];
    final orderVal = json['order'] ?? json['order_index'];
    final numOrder = (orderVal is num) ? orderVal.toInt() : (int.tryParse(orderVal?.toString() ?? '') ?? 0);

    return Chapter(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['name']?.toString() ?? '',
      name: json['name']?.toString(),
      order: numOrder,
      videos: vids.map((v) => VideoItem.fromJson(v as Map<String, dynamic>)).toList(),
    );
  }
}

class VideoItem {
  final String id;
  final String title;
  final String? thumbnail;
  final int durationSeconds;
  final int progressPercent;
  final bool isLocked;
  final bool isLiveRecording;

  VideoItem({
    required this.id,
    required this.title,
    this.thumbnail,
    required this.durationSeconds,
    required this.progressPercent,
    required this.isLocked,
    required this.isLiveRecording,
  });

  factory VideoItem.fromJson(Map<String, dynamic> json) {
    final durVal = json['durationSeconds'] ?? json['duration_seconds'];
    final numDur = (durVal is num) ? durVal.toInt() : (int.tryParse(durVal?.toString() ?? '') ?? 0);
    final progVal = json['progressPercent'] ?? json['progress_percent'];
    final numProg = (progVal is num) ? progVal.toInt() : (int.tryParse(progVal?.toString() ?? '') ?? 0);

    return VideoItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      thumbnail: json['thumbnail']?.toString(),
      durationSeconds: numDur,
      progressPercent: numProg,
      isLocked: json['isLocked'] ?? json['is_locked'] ?? false,
      isLiveRecording: json['isLiveRecording'] ?? json['isLiveRec'] ?? false,
    );
  }
}

class LiveClass {
  final String id;
  final String title;
  final String? description;
  final String? youtubeVideoId;
  final String scheduledAt;
  final String? startedAt;
  final String? endedAt;
  final String status;

  LiveClass({
    required this.id,
    required this.title,
    this.description,
    this.youtubeVideoId,
    required this.scheduledAt,
    this.startedAt,
    this.endedAt,
    required this.status,
  });

  factory LiveClass.fromJson(Map<String, dynamic> json) {
    return LiveClass(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      youtubeVideoId: json['youtube_video_id'] ?? json['youtubeVideoId'],
      scheduledAt: json['scheduled_at'] ?? json['scheduledAt'] ?? '',
      startedAt: json['started_at'],
      endedAt: json['ended_at'],
      status: json['status'] ?? 'scheduled',
    );
  }
}

class StudyMaterialItem {
  final String id;
  final String title;
  final String type;
  final String? fileUrl;
  final bool isFreePreview;

  StudyMaterialItem({
    required this.id,
    required this.title,
    required this.type,
    this.fileUrl,
    required this.isFreePreview,
  });

  factory StudyMaterialItem.fromJson(Map<String, dynamic> json) {
    return StudyMaterialItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      type: json['type'] ?? 'pdf',
      fileUrl: json['file_url'] ?? json['fileUrl'],
      isFreePreview: json['is_free_preview'] ?? json['isFreePreview'] ?? false,
    );
  }
}
