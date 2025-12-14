import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inskate/core/config/api_config.dart';
import 'package:inskate/core/services/api_client.dart';
import 'package:inskate/shared/models/lesson.dart';

// Categories provider
final categoriesProvider = FutureProvider<List<LessonCategory>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiConfig.categories);

  if (response.data['success'] == true) {
    final data = response.data['data'] as List;
    return data.map((json) => LessonCategory.fromJson(json)).toList();
  }
  return [];
});

// Lessons by category provider
final lessonsByCategoryProvider = FutureProvider.family<List<Lesson>, String>((ref, categoryId) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(
    ApiConfig.lessons,
    queryParameters: {'categoryId': categoryId},
  );

  if (response.data['success'] == true) {
    final data = response.data['data'] as List;
    return data.map((json) => Lesson.fromJson(json)).toList();
  }
  return [];
});

// Single lesson provider
final lessonProvider = FutureProvider.family<Lesson?, String>((ref, lessonId) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiConfig.lessons}/$lessonId');

  if (response.data['success'] == true) {
    return Lesson.fromJson(response.data['data']);
  }
  return null;
});

// Lesson comments provider
final lessonCommentsProvider = FutureProvider.family<List<LessonComment>, String>((ref, lessonId) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiConfig.comments}/lesson/$lessonId');

  if (response.data['success'] == true) {
    final data = response.data['data'] as List;
    return data.map((json) => LessonComment.fromJson(json)).toList();
  }
  return [];
});

// Add comment
final addCommentProvider = Provider((ref) {
  return (String lessonId, String text) async {
    final api = ref.read(apiClientProvider);
    final response = await api.post(ApiConfig.comments, data: {
      'lessonId': lessonId,
      'text': text,
    });
    return response.data['success'] == true;
  };
});

