import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/lessons/providers/lessons_provider.dart';
import 'package:inskate/features/auth/providers/auth_provider.dart';

class LessonDetailPage extends ConsumerStatefulWidget {
  final String lessonId;

  const LessonDetailPage({super.key, required this.lessonId});

  @override
  ConsumerState<LessonDetailPage> createState() => _LessonDetailPageState();
}

class _LessonDetailPageState extends ConsumerState<LessonDetailPage> {
  final _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _openVideo(String? videoUrl) async {
    if (videoUrl == null) return;
    
    final uri = Uri.parse(videoUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _addComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final addComment = ref.read(addCommentProvider);
    final success = await addComment(widget.lessonId, text);

    if (success) {
      _commentController.clear();
      ref.invalidate(lessonCommentsProvider(widget.lessonId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final lessonAsync = ref.watch(lessonProvider(widget.lessonId));
    final commentsAsync = ref.watch(lessonCommentsProvider(widget.lessonId));
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      body: lessonAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Ошибка: $error')),
        data: (lesson) {
          if (lesson == null) {
            return const Center(child: Text('Урок не найден'));
          }

          return CustomScrollView(
            slivers: [
              // Video Player or Locked State
              SliverToBoxAdapter(
                child: lesson.hasAccess
                    ? Container(
                        height: 220,
                        decoration: BoxDecoration(
                          color: Colors.black,
                          image: lesson.thumbnailUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(lesson.thumbnailUrl!),
                                  fit: BoxFit.cover,
                                  opacity: 0.7,
                                )
                              : null,
                        ),
                        child: Center(
                          child: IconButton(
                            onPressed: () => _openVideo(lesson.videoUrl),
                            icon: const Icon(
                              Icons.play_circle_fill,
                              size: 72,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      )
                    : Container(
                        height: 220,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.lock,
                                size: 48,
                                color: Colors.white,
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Премиум контент',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: () => context.push('/subscription'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: AppColors.primary,
                                ),
                                child: const Text('Оформить подписку'),
                              ),
                            ],
                          ),
                        ),
                      ),
              ),

              // Lesson info
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lesson.title,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      if (lesson.description != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          lesson.description!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      // Contact button
                      OutlinedButton.icon(
                        onPressed: () => context.push('/contact', extra: lesson.id),
                        icon: const Icon(Icons.support_agent),
                        label: const Text('Связаться с нами'),
                      ),
                    ],
                  ),
                ),
              ),

              // Comments section
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Text(
                        'Комментарии',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(width: 8),
                      commentsAsync.whenOrNull(
                        data: (comments) => Chip(
                          label: Text('${comments.length}'),
                        ),
                      ) ?? const SizedBox(),
                    ],
                  ),
                ),
              ),

              // Add comment
              if (user != null)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _commentController,
                            decoration: const InputDecoration(
                              hintText: 'Написать комментарий...',
                            ),
                            maxLines: 2,
                            minLines: 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: _addComment,
                          icon: const Icon(Icons.send),
                          color: AppColors.primary,
                        ),
                      ],
                    ),
                  ),
                ),

              // Comments list
              commentsAsync.when(
                loading: () => const SliverToBoxAdapter(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (_, __) => const SliverToBoxAdapter(
                  child: Center(child: Text('Ошибка загрузки комментариев')),
                ),
                data: (comments) => SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final comment = comments[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primaryLight.withValues(alpha: 0.2),
                          child: Text(
                            comment.user.name[0].toUpperCase(),
                            style: const TextStyle(color: AppColors.primary),
                          ),
                        ),
                        title: Text(comment.user.name),
                        subtitle: Text(comment.text),
                        trailing: Text(
                          _formatDate(comment.createdAt),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      );
                    },
                    childCount: comments.length,
                  ),
                ),
              ),

              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          );
        },
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays > 0) {
      return '${diff.inDays}д назад';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}ч назад';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}м назад';
    }
    return 'Только что';
  }
}
