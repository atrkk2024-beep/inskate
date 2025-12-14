import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inskate/core/config/api_config.dart';
import 'package:inskate/core/services/api_client.dart';
import 'package:inskate/core/services/storage_service.dart';
import 'package:inskate/core/services/push_notification_service.dart';
import 'package:inskate/shared/models/user.dart';

class AuthState {
  final bool isAuthenticated;
  final bool needsOnboarding;
  final User? user;

  AuthState({
    required this.isAuthenticated,
    required this.needsOnboarding,
    this.user,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? needsOnboarding,
    User? user,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      needsOnboarding: needsOnboarding ?? this.needsOnboarding,
      user: user ?? this.user,
    );
  }
}

final authStateProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    return _checkAuth();
  }

  Future<AuthState> _checkAuth() async {
    final storage = ref.read(storageServiceProvider);
    final token = await storage.getAccessToken();

    if (token == null) {
      return AuthState(isAuthenticated: false, needsOnboarding: false);
    }

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get(ApiConfig.me);

      if (response.data['success'] == true) {
        final user = User.fromJson(response.data['data']['user']);
        final needsOnboarding = user.name == null || user.name!.isEmpty;

        return AuthState(
          isAuthenticated: true,
          needsOnboarding: needsOnboarding,
          user: user,
        );
      }
    } catch (e) {
      // Token invalid, clear storage
      await storage.clearTokens();
    }

    return AuthState(isAuthenticated: false, needsOnboarding: false);
  }

  Future<void> sendCode(String phone) async {
    final api = ref.read(apiClientProvider);
    await api.post(ApiConfig.sendCode, data: {'phone': phone});
  }

  Future<bool> verifyCode(String phone, String code) async {
    final api = ref.read(apiClientProvider);
    final storage = ref.read(storageServiceProvider);

    final response = await api.post(ApiConfig.verifyCode, data: {
      'phone': phone,
      'code': code,
    });

    if (response.data['success'] == true) {
      final data = response.data['data'];
      await storage.saveTokens(data['accessToken'], data['refreshToken']);
      await storage.saveUserId(data['user']['id']);

      final user = User.fromJson(data['user']);
      final isNewUser = data['isNewUser'] as bool? ?? false;

      // Register device token for push
      await _registerDeviceToken();

      state = AsyncData(AuthState(
        isAuthenticated: true,
        needsOnboarding: isNewUser || user.name == null,
        user: user,
      ));

      return true;
    }

    return false;
  }

  Future<void> updateProfile(String name) async {
    final api = ref.read(apiClientProvider);
    final storage = ref.read(storageServiceProvider);

    final response = await api.patch(ApiConfig.updateProfile, data: {
      'name': name,
    });

    if (response.data['success'] == true) {
      await storage.setOnboardingComplete(true);

      final currentState = state.valueOrNull;
      if (currentState != null && currentState.user != null) {
        state = AsyncData(currentState.copyWith(
          needsOnboarding: false,
          user: currentState.user!.copyWith(name: name),
        ));
      }
    }
  }

  Future<void> _registerDeviceToken() async {
    try {
      final token = await PushNotificationService.getToken();
      if (token != null) {
        final api = ref.read(apiClientProvider);
        await api.post(ApiConfig.deviceToken, data: {
          'token': token,
          'platform': _getPlatform(),
        });
      }
    } catch (e) {
      // Ignore push registration errors
    }
  }

  String _getPlatform() {
    // In real app, detect actual platform
    return 'android';
  }

  Future<void> logout() async {
    final api = ref.read(apiClientProvider);
    final storage = ref.read(storageServiceProvider);

    try {
      await api.post(ApiConfig.logout);
    } catch (e) {
      // Ignore logout errors
    }

    await storage.clearAll();
    state = AsyncData(AuthState(isAuthenticated: false, needsOnboarding: false));
  }

  Future<void> refreshUser() async {
    final newState = await _checkAuth();
    state = AsyncData(newState);
  }
}

// Provider for easy access to current user
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authStateProvider).valueOrNull?.user;
});

final isSubscriberProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider)?.isSubscriber ?? false;
});

