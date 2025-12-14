import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/booking/providers/booking_provider.dart';
import 'package:inskate/shared/models/coach.dart';

class CoachDetailPage extends ConsumerStatefulWidget {
  final String coachId;

  const CoachDetailPage({super.key, required this.coachId});

  @override
  ConsumerState<CoachDetailPage> createState() => _CoachDetailPageState();
}

class _CoachDetailPageState extends ConsumerState<CoachDetailPage> {
  String? _selectedSlotId;
  bool _isLoading = false;

  Future<void> _book() async {
    if (_selectedSlotId == null) return;

    setState(() => _isLoading = true);

    try {
      final createBooking = ref.read(createBookingProvider);
      final success = await createBooking(
        coachId: widget.coachId,
        slotId: _selectedSlotId!,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Бронирование создано!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final coachAsync = ref.watch(coachProvider(widget.coachId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Запись на тренировку'),
      ),
      body: coachAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Ошибка: $error')),
        data: (coach) {
          if (coach == null) {
            return const Center(child: Text('Тренер не найден'));
          }

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Coach info
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: AppColors.primaryLight.withOpacity(0.2),
                            backgroundImage: coach.avatarUrl != null
                                ? CachedNetworkImageProvider(coach.avatarUrl!)
                                : null,
                            child: coach.avatarUrl == null
                                ? Text(
                                    coach.name[0].toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  coach.name,
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                                if (coach.level != null)
                                  Text(
                                    coach.level!,
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: AppColors.textSecondary,
                                        ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      if (coach.bio != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          coach.bio!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],

                      // Social links
                      if (coach.socials.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          children: coach.socials.entries.map((entry) {
                            return ActionChip(
                              avatar: Icon(_getSocialIcon(entry.key), size: 18),
                              label: Text(entry.value),
                              onPressed: () => _openSocial(entry.key, entry.value),
                            );
                          }).toList(),
                        ),
                      ],

                      const SizedBox(height: 24),

                      // Available slots
                      Text(
                        'Доступные слоты',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),

                      if (coach.slots == null || coach.slots!.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.info_outline, color: AppColors.warning),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text('Нет доступных слотов на ближайшее время'),
                              ),
                            ],
                          ),
                        )
                      else
                        ..._groupSlotsByDate(coach.slots!).entries.map((entry) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: Text(
                                  entry.key,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: entry.value.map((slot) {
                                  final isSelected = slot.id == _selectedSlotId;
                                  return ChoiceChip(
                                    label: Text(_formatTime(slot.startAt)),
                                    selected: isSelected,
                                    onSelected: (_) {
                                      setState(() => _selectedSlotId = slot.id);
                                    },
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 8),
                            ],
                          );
                        }),
                    ],
                  ),
                ),
              ),

              // Book button
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
                  child: ElevatedButton(
                    onPressed: _selectedSlotId != null && !_isLoading ? _book : null,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Записаться'),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Map<String, List<CoachSlot>> _groupSlotsByDate(List<CoachSlot> slots) {
    final grouped = <String, List<CoachSlot>>{};
    for (final slot in slots) {
      final dateKey = _formatDate(slot.startAt);
      grouped.putIfAbsent(dateKey, () => []).add(slot);
    }
    return grouped;
  }

  String _formatDate(DateTime date) {
    final weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return '${weekdays[date.weekday - 1]}, ${date.day}.${date.month.toString().padLeft(2, '0')}';
  }

  String _formatTime(DateTime date) {
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  IconData _getSocialIcon(String social) {
    switch (social.toLowerCase()) {
      case 'instagram':
        return Icons.camera_alt;
      case 'youtube':
        return Icons.play_circle;
      case 'telegram':
        return Icons.send;
      default:
        return Icons.link;
    }
  }

  Future<void> _openSocial(String social, String handle) async {
    String url;
    switch (social.toLowerCase()) {
      case 'instagram':
        url = 'https://instagram.com/$handle';
        break;
      case 'youtube':
        url = 'https://youtube.com/@$handle';
        break;
      case 'telegram':
        url = 'https://t.me/$handle';
        break;
      default:
        return;
    }

    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

