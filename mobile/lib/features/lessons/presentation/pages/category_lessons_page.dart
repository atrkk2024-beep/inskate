import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/lessons/providers/lessons_provider.dart';
import 'package:inskate/shared/widgets/lesson_card.dart';

class CategoryLessonsPage extends ConsumerWidget {
  final String categoryId;
  final String categoryTitle;

  const CategoryLessonsPage({
    super.key,
    required this.categoryId,
    required this.categoryTitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lessonsAsync = ref.watch(lessonsByCategoryProvider(categoryId));

    return Scaffold(
      appBar: AppBar(
        title: Text(categoryTitle),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(lessonsByCategoryProvider(categoryId));
        },
        child: lessonsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                Text('Ошибка загрузки'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(lessonsByCategoryProvider(categoryId)),
                  child: const Text('Повторить'),
                ),
              ],
            ),
          ),
          data: (lessons) {
            if (lessons.isEmpty) {
              return const Center(
                child: Text('Уроков пока нет'),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.only(top: 8, bottom: 100),
              itemCount: lessons.length,
              itemBuilder: (context, index) {
                final lesson = lessons[index];
                return LessonCard(
                  lesson: lesson,
                  onTap: () => context.push('/lesson/${lesson.id}'),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

