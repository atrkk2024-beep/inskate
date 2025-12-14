import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/video_review/providers/video_review_provider.dart';

class VideoReviewDetailPage extends ConsumerStatefulWidget {
  final String reviewId;

  const VideoReviewDetailPage({super.key, required this.reviewId});

  @override
  ConsumerState<VideoReviewDetailPage> createState() => _VideoReviewDetailPageState();
}

class _VideoReviewDetailPageState extends ConsumerState<VideoReviewDetailPage> {
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final addMessage = ref.read(addReviewMessageProvider);
    final success = await addMessage(widget.reviewId, text);

    if (success) {
      _messageController.clear();
      ref.invalidate(videoReviewProvider(widget.reviewId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final reviewAsync = ref.watch(videoReviewProvider(widget.reviewId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Видеоразбор'),
      ),
      body: reviewAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Ошибка: $error')),
        data: (review) {
          if (review == null) {
            return const Center(child: Text('Разбор не найден'));
          }

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Status card
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Chip(
                                  label: Text(review.statusName),
                                  backgroundColor: _getStatusColor(review.status).withOpacity(0.1),
                                ),
                                const Spacer(),
                                Text(
                                  _formatDate(review.createdAt),
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            if (review.coach != null)
                              Text(
                                'Тренер: ${review.coach!.name}',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            const SizedBox(height: 8),
                            OutlinedButton.icon(
                              onPressed: () => _openVideo(review.videoUrl),
                              icon: const Icon(Icons.play_circle),
                              label: const Text('Открыть видео'),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Messages
                    Text(
                      'Сообщения',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),

                    if (review.messages.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: Text('Пока нет сообщений'),
                        ),
                      )
                    else
                      ...review.messages.map((message) {
                        final isCoach = message.isCoach;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isCoach
                                ? AppColors.primaryLight.withOpacity(0.1)
                                : AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    isCoach ? 'Тренер' : 'Вы',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: isCoach ? AppColors.primary : null,
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    _formatDateTime(message.createdAt),
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(message.text),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ),

              // Message input
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          decoration: const InputDecoration(
                            hintText: 'Написать сообщение...',
                            border: OutlineInputBorder(),
                          ),
                          maxLines: 2,
                          minLines: 1,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: _sendMessage,
                        icon: const Icon(Icons.send),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
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

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }

  String _formatDateTime(DateTime date) {
    return '${_formatDate(date)} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _openVideo(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

