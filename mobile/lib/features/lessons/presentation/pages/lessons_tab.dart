import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/lessons/providers/lessons_provider.dart';
import 'package:inskate/shared/widgets/category_card.dart';

class LessonsTab extends ConsumerWidget {
  const LessonsTab({super.key});

  IconData _getCategoryIcon(String title) {
    final lowerTitle = title.toLowerCase();
    if (lowerTitle.contains('прыжк')) return Icons.sports;
    if (lowerTitle.contains('вращен')) return Icons.rotate_right;
    if (lowerTitle.contains('офп')) return Icons.fitness_center;
    return Icons.play_circle_outline;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('⛸️', style: TextStyle(fontSize: 18)),
            ),
            const SizedBox(width: 8),
            const Text('InSkate'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.support_agent),
            onPressed: () => context.push('/contact'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(categoriesProvider);
        },
        child: categoriesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                Text('Ошибка загрузки: $error'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(categoriesProvider),
                  child: const Text('Повторить'),
                ),
              ],
            ),
          ),
          data: (categories) => CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Видео уроки',
                        style: Theme.of(context).textTheme.displaySmall,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Выберите категорию для начала обучения',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final category = categories[index];
                    return CategoryCard(
                      category: category,
                      icon: _getCategoryIcon(category.title),
                      onTap: () => context.push(
                        '/category/${category.id}',
                        extra: category.title,
                      ),
                    );
                  },
                  childCount: categories.length,
                ),
              ),
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

