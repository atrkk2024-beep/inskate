import 'coach.dart';

class VideoReview {
  final String id;
  final String videoUrl;
  final String status;
  final Coach? coach;
  final List<VideoReviewMessage> messages;
  final DateTime createdAt;
  final DateTime? resolvedAt;

  VideoReview({
    required this.id,
    required this.videoUrl,
    required this.status,
    this.coach,
    this.messages = const [],
    required this.createdAt,
    this.resolvedAt,
  });

  factory VideoReview.fromJson(Map<String, dynamic> json) {
    return VideoReview(
      id: json['id'] as String,
      videoUrl: json['videoUrl'] as String,
      status: json['status'] as String,
      coach: json['coach'] != null
          ? Coach.fromJson(json['coach'] as Map<String, dynamic>)
          : null,
      messages: json['messages'] != null
          ? (json['messages'] as List)
              .map((m) => VideoReviewMessage.fromJson(m as Map<String, dynamic>))
              .toList()
          : [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'] as String)
          : null,
    );
  }

  String get statusName {
    switch (status) {
      case 'DRAFT':
        return 'Черновик';
      case 'SUBMITTED':
        return 'Отправлен';
      case 'IN_REVIEW':
        return 'На разборе';
      case 'DONE':
        return 'Завершён';
      case 'REJECTED':
        return 'Отклонён';
      default:
        return status;
    }
  }
}

class VideoReviewMessage {
  final String id;
  final String authorRole;
  final String text;
  final DateTime createdAt;

  VideoReviewMessage({
    required this.id,
    required this.authorRole,
    required this.text,
    required this.createdAt,
  });

  factory VideoReviewMessage.fromJson(Map<String, dynamic> json) {
    return VideoReviewMessage(
      id: json['id'] as String,
      authorRole: json['authorRole'] as String,
      text: json['text'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  bool get isCoach => authorRole == 'coach';
}

