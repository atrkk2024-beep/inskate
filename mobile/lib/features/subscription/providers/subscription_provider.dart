import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inskate/core/config/api_config.dart';
import 'package:inskate/core/services/api_client.dart';
import 'package:inskate/shared/models/plan.dart';

final plansProvider = FutureProvider<List<Plan>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiConfig.plans);

  if (response.data['success'] == true) {
    final data = response.data['data'] as List;
    return data.map((json) => Plan.fromJson(json)).toList();
  }
  return [];
});

final createCheckoutProvider = Provider((ref) {
  return (String planId) async {
    final api = ref.read(apiClientProvider);
    final response = await api.post('${ApiConfig.subscriptions}/checkout', data: {
      'planId': planId,
    });

    if (response.data['success'] == true) {
      return response.data['data']['checkoutUrl'] as String?;
    }
    return null;
  };
});

