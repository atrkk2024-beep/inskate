import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inskate/features/auth/presentation/pages/phone_input_page.dart';
import 'package:inskate/features/auth/presentation/pages/otp_verification_page.dart';
import 'package:inskate/features/auth/presentation/pages/onboarding_page.dart';
import 'package:inskate/features/auth/providers/auth_provider.dart';
import 'package:inskate/features/home/presentation/pages/home_page.dart';
import 'package:inskate/features/lessons/presentation/pages/category_lessons_page.dart';
import 'package:inskate/features/lessons/presentation/pages/lesson_detail_page.dart';
import 'package:inskate/features/subscription/presentation/pages/subscription_page.dart';
import 'package:inskate/features/booking/presentation/pages/booking_page.dart';
import 'package:inskate/features/booking/presentation/pages/coach_detail_page.dart';
import 'package:inskate/features/video_review/presentation/pages/video_reviews_page.dart';
import 'package:inskate/features/video_review/presentation/pages/video_review_detail_page.dart';
import 'package:inskate/features/profile/presentation/pages/profile_page.dart';
import 'package:inskate/features/support/presentation/pages/contact_page.dart';
import 'package:inskate/shared/widgets/splash_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoading = authState.isLoading;
      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final needsOnboarding = authState.valueOrNull?.needsOnboarding ?? false;
      
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      final isOnboardingRoute = state.matchedLocation == '/onboarding';
      
      if (isLoading) {
        return null;
      }
      
      if (!isAuthenticated && !isAuthRoute) {
        return '/auth/phone';
      }
      
      if (isAuthenticated && needsOnboarding && !isOnboardingRoute) {
        return '/onboarding';
      }
      
      if (isAuthenticated && !needsOnboarding && (isAuthRoute || isOnboardingRoute)) {
        return '/';
      }
      
      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: '/',
        builder: (context, state) => const HomePage(),
      ),
      
      // Auth routes
      GoRoute(
        path: '/auth/phone',
        builder: (context, state) => const PhoneInputPage(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return OtpVerificationPage(phone: phone);
        },
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),
      
      // Lessons
      GoRoute(
        path: '/category/:id',
        builder: (context, state) {
          final categoryId = state.pathParameters['id']!;
          final categoryTitle = state.extra as String? ?? '';
          return CategoryLessonsPage(
            categoryId: categoryId,
            categoryTitle: categoryTitle,
          );
        },
      ),
      GoRoute(
        path: '/lesson/:id',
        builder: (context, state) {
          final lessonId = state.pathParameters['id']!;
          return LessonDetailPage(lessonId: lessonId);
        },
      ),
      
      // Subscription
      GoRoute(
        path: '/subscription',
        builder: (context, state) => const SubscriptionPage(),
      ),
      
      // Booking
      GoRoute(
        path: '/booking',
        builder: (context, state) => const BookingPage(),
      ),
      GoRoute(
        path: '/coach/:id',
        builder: (context, state) {
          final coachId = state.pathParameters['id']!;
          return CoachDetailPage(coachId: coachId);
        },
      ),
      
      // Video Reviews
      GoRoute(
        path: '/video-reviews',
        builder: (context, state) => const VideoReviewsPage(),
      ),
      GoRoute(
        path: '/video-review/:id',
        builder: (context, state) {
          final reviewId = state.pathParameters['id']!;
          return VideoReviewDetailPage(reviewId: reviewId);
        },
      ),
      
      // Profile
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfilePage(),
      ),
      
      // Support
      GoRoute(
        path: '/contact',
        builder: (context, state) {
          final lessonId = state.extra as String?;
          return ContactPage(lessonId: lessonId);
        },
      ),
    ],
  );
});

