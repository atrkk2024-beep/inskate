import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/auth/providers/auth_provider.dart';
import 'package:inskate/features/video_review/providers/video_review_provider.dart';

class ReviewsTab extends ConsumerWidget {
  const ReviewsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSubscriber = ref.watch(isSubscriberProvider);
    final reviewsAsync = ref.watch(userVideoReviewsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Мои видеоразборы'),
      ),
      body: !isSubscriber
          ? _buildLockedState(context)
          : reviewsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text('Ошибка: $error')),
              data: (reviews) {
                if (reviews.isEmpty) {
                  return _buildEmptyState(context);
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: reviews.length,
                  itemBuilder: (context, index) {
                    final review = reviews[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        onTap: () => context.push('/video-review/${review.id}'),
                        leading: CircleAvatar(
                          backgroundColor: _getStatusColor(review.status).withOpacity(0.2),
                          child: Icon(
                            _getStatusIcon(review.status),
                            color: _getStatusColor(review.status),
                          ),
                        ),
                        title: Text(
                          review.coach?.name ?? 'Ожидает назначения',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(review.statusName),
                            Text(
                              _formatDate(review.createdAt),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                        trailing: review.messages.isNotEmpty
                            ? Badge(
                                label: Text('${review.messages.length}'),
                                child: const Icon(Icons.chat_bubble_outline),
                              )
                            : null,
                      ),
                    );
                  },
                );
              },
            ),
      floatingActionButton: isSubscriber
          ? FloatingActionButton.extended(
              onPressed: () => _showUploadDialog(context, ref),
              icon: const Icon(Icons.add),
              label: const Text('Загрузить видео'),
            )
          : null,
    );
  }

  Widget _buildLockedState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.secondary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock,
                size: 64,
                color: AppColors.secondary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Видеоразборы доступны\nпо подписке',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(
              'Оформите подписку, чтобы отправлять видео на разбор тренерам',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.push('/subscription'),
              child: const Text('Оформить подписку'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.video_call_outlined,
            size: 64,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'У вас пока нет видеоразборов',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Загрузите видео и получите разбор от тренера',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }

  void _showUploadDialog(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Отправить видео на разбор',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                decoration: const InputDecoration(
                  labelText: 'Ссылка на видео',
                  hintText: 'https://...',
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  final url = controller.text.trim();
                  if (url.isEmpty) return;

                  final createReview = ref.read(createVideoReviewProvider);
                  final success = await createReview(videoUrl: url);

                  if (success) {
                    ref.invalidate(userVideoReviewsProvider);
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Видео отправлено на разбор'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                },
                child: const Text('Отправить'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'SUBMITTED':
        return AppColors.warning;
      case 'IN_REVIEW':
        return AppColors.info;
      case 'DONE':
        return AppColors.success;
      case 'REJECTED':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'SUBMITTED':
        return Icons.hourglass_empty;
      case 'IN_REVIEW':
        return Icons.play_circle;
      case 'DONE':
        return Icons.check_circle;
      case 'REJECTED':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}

