class LessonCategory {
  final String id;
  final String title;
  final int order;
  final int lessonCount;

  LessonCategory({
    required this.id,
    required this.title,
    required this.order,
    required this.lessonCount,
  });

  factory LessonCategory.fromJson(Map<String, dynamic> json) {
    return LessonCategory(
      id: json['id'] as String,
      title: json['title'] as String,
      order: json['order'] as int? ?? 0,
      lessonCount: json['lessonCount'] as int? ?? 0,
    );
  }
}

class Lesson {
  final String id;
  final String categoryId;
  final String title;
  final String? description;
  final int durationSec;
  final String? thumbnailUrl;
  final String? videoUrl;
  final bool isFree;
  final bool hasAccess;
  final int commentCount;

  Lesson({
    required this.id,
    required this.categoryId,
    required this.title,
    this.description,
    required this.durationSec,
    this.thumbnailUrl,
    this.videoUrl,
    required this.isFree,
    this.hasAccess = false,
    this.commentCount = 0,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      durationSec: json['durationSec'] as int? ?? 0,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      isFree: json['isFree'] as bool? ?? false,
      hasAccess: json['hasAccess'] as bool? ?? false,
      commentCount: json['commentCount'] as int? ?? 0,
    );
  }

  String get formattedDuration {
    final minutes = durationSec ~/ 60;
    final seconds = durationSec % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}

class LessonComment {
  final String id;
  final String text;
  final DateTime createdAt;
  final CommentUser user;

  LessonComment({
    required this.id,
    required this.text,
    required this.createdAt,
    required this.user,
  });

  factory LessonComment.fromJson(Map<String, dynamic> json) {
    return LessonComment(
      id: json['id'] as String,
      text: json['text'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: CommentUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class CommentUser {
  final String id;
  final String name;

  CommentUser({required this.id, required this.name});

  factory CommentUser.fromJson(Map<String, dynamic> json) {
    return CommentUser(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

