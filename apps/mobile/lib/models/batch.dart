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
  });

  factory BatchSummary.fromJson(Map<String, dynamic> json) {
    return BatchSummary(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      thumbnail: json['thumbnail'],
      price: (json['price'] ?? 0).toDouble(),
      isFree: json['is_free'] ?? json['isFree'] ?? false,
      description: json['description'],
      targetExam: json['target_exam'] ?? json['targetExam'],
      language: json['language'],
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
    required this.isEnrolled,
    required this.subjects,
    required this.progressPercent,
  });

  factory BatchDetail.fromJson(Map<String, dynamic> json) {
    var subs = json['subjects'] as List? ?? [];
    return BatchDetail(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      thumbnail: json['thumbnail'],
      price: (json['price'] ?? 0).toDouble(),
      isFree: json['is_free'] ?? json['isFree'] ?? false,
      description: json['description'],
      targetExam: json['target_exam'] ?? json['targetExam'],
      language: json['language'],
      isEnrolled: json['isEnrolled'] ?? false,
      subjects: subs.map((s) => Subject.fromJson(s)).toList(),
      progressPercent: json['progressPercent'] ?? 0,
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
      id: json['id'] ?? '',
      title: json['title'] ?? json['name'] ?? '',
      name: json['name'],
      chapters: chaps.map((c) => Chapter.fromJson(c)).toList(),
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
    return Chapter(
      id: json['id'] ?? '',
      title: json['title'] ?? json['name'] ?? '',
      name: json['name'],
      order: json['order'] ?? 0,
      videos: vids.map((v) => VideoItem.fromJson(v)).toList(),
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
    return VideoItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      thumbnail: json['thumbnail'],
      durationSeconds: json['durationSeconds'] ?? 0,
      progressPercent: json['progressPercent'] ?? 0,
      isLocked: json['isLocked'] ?? false,
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
