import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inskate/core/config/api_config.dart';
import 'package:inskate/core/services/api_client.dart';
import 'package:inskate/shared/models/video_review.dart';

final userVideoReviewsProvider = FutureProvider<List<VideoReview>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiConfig.videoReviews}/me');

  if (response.data['success'] == true) {
    final data = response.data['data'] as List;
    return data.map((json) => VideoReview.fromJson(json)).toList();
  }
  return [];
});

final videoReviewProvider = FutureProvider.family<VideoReview?, String>((ref, reviewId) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiConfig.videoReviews}/$reviewId');

  if (response.data['success'] == true) {
    return VideoReview.fromJson(response.data['data']);
  }
  return null;
});

final createVideoReviewProvider = Provider((ref) {
  return ({required String videoUrl, String? coachId}) async {
    final api = ref.read(apiClientProvider);
    final response = await api.post(ApiConfig.videoReviews, data: {
      'videoUrl': videoUrl,
      if (coachId != null) 'coachId': coachId,
    });
    return response.data['success'] == true;
  };
});

final addReviewMessageProvider = Provider((ref) {
  return (String reviewId, String text) async {
    final api = ref.read(apiClientProvider);
    final response = await api.post('${ApiConfig.videoReviews}/$reviewId/messages', data: {
      'text': text,
    });
    return response.data['success'] == true;
  };
});

