class Plan {
  final String id;
  final String name;
  final int price;
  final String currency;
  final String interval;
  final int trialDays;
  final List<String> features;

  Plan({
    required this.id,
    required this.name,
    required this.price,
    required this.currency,
    required this.interval,
    required this.trialDays,
    required this.features,
  });

  factory Plan.fromJson(Map<String, dynamic> json) {
    return Plan(
      id: json['id'] as String,
      name: json['name'] as String,
      price: json['price'] as int,
      currency: json['currency'] as String,
      interval: json['interval'] as String,
      trialDays: json['trialDays'] as int? ?? 0,
      features: json['features'] != null
          ? List<String>.from(json['features'] as List)
          : [],
    );
  }

  String get formattedPrice {
    final amount = price / 100;
    switch (currency) {
      case 'RUB':
        return '${amount.toStringAsFixed(0)} ₽';
      case 'USD':
        return '\$${amount.toStringAsFixed(2)}';
      case 'EUR':
        return '€${amount.toStringAsFixed(2)}';
      default:
        return '${amount.toStringAsFixed(2)} $currency';
    }
  }

  String get intervalName {
    switch (interval) {
      case 'month':
        return 'в месяц';
      case 'year':
        return 'в год';
      default:
        return interval;
    }
  }
}

