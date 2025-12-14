import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inskate/core/config/api_config.dart';
import 'package:inskate/core/services/api_client.dart';
import 'package:inskate/shared/models/coach.dart';

final coachesProvider = FutureProvider<List<Coach>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiConfig.coaches);

  if (response.data['success'] == true) {
    final data = response.data['data'] as List;
    return data.map((json) => Coach.fromJson(json)).toList();
  }
  return [];
});

final coachProvider = FutureProvider.family<Coach?, String>((ref, coachId) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiConfig.coaches}/$coachId');

  if (response.data['success'] == true) {
    return Coach.fromJson(response.data['data']);
  }
  return null;
});

final userBookingsProvider = FutureProvider<List<Booking>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiConfig.bookings}/me');

  if (response.data['success'] == true) {
    final data = response.data['data'] as List;
    return data.map((json) => Booking.fromJson(json)).toList();
  }
  return [];
});

final createBookingProvider = Provider((ref) {
  return ({
    required String coachId,
    required String slotId,
    String type = 'SINGLE',
  }) async {
    final api = ref.read(apiClientProvider);
    final response = await api.post(ApiConfig.bookings, data: {
      'coachId': coachId,
      'slotId': slotId,
      'type': type,
    });
    return response.data['success'] == true;
  };
});

