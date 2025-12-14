class User {
  final String id;
  final String phone;
  final String? name;
  final String role;
  final String? country;
  final DateTime createdAt;
  final Subscription? subscription;

  User({
    required this.id,
    required this.phone,
    this.name,
    required this.role,
    this.country,
    required this.createdAt,
    this.subscription,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      phone: json['phone'] as String,
      name: json['name'] as String?,
      role: json['role'] as String,
      country: json['country'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      subscription: json['subscription'] != null
          ? Subscription.fromJson(json['subscription'] as Map<String, dynamic>)
          : null,
    );
  }

  bool get isSubscriber => 
      subscription != null && 
      (subscription!.status == 'TRIAL' || subscription!.status == 'ACTIVE');

  User copyWith({
    String? name,
    Subscription? subscription,
  }) {
    return User(
      id: id,
      phone: phone,
      name: name ?? this.name,
      role: role,
      country: country,
      createdAt: createdAt,
      subscription: subscription ?? this.subscription,
    );
  }
}

class Subscription {
  final String status;
  final String plan;
  final DateTime? trialEndAt;
  final DateTime? currentPeriodEndAt;

  Subscription({
    required this.status,
    required this.plan,
    this.trialEndAt,
    this.currentPeriodEndAt,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      status: json['status'] as String,
      plan: json['plan'] as String,
      trialEndAt: json['trialEndAt'] != null
          ? DateTime.parse(json['trialEndAt'] as String)
          : null,
      currentPeriodEndAt: json['currentPeriodEndAt'] != null
          ? DateTime.parse(json['currentPeriodEndAt'] as String)
          : null,
    );
  }

  bool get isActive => status == 'TRIAL' || status == 'ACTIVE';
}

