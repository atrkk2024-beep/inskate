import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inskate/features/video_review/presentation/pages/reviews_tab.dart';

class VideoReviewsPage extends ConsumerWidget {
  const VideoReviewsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const ReviewsTab();
  }
}

