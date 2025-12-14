class Coach {
  final String id;
  final String name;
  final String? level;
  final String? bio;
  final String? avatarUrl;
  final Map<String, String> socials;
  final List<CoachSlot>? slots;

  Coach({
    required this.id,
    required this.name,
    this.level,
    this.bio,
    this.avatarUrl,
    this.socials = const {},
    this.slots,
  });

  factory Coach.fromJson(Map<String, dynamic> json) {
    return Coach(
      id: json['id'] as String,
      name: json['name'] as String,
      level: json['level'] as String?,
      bio: json['bio'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      socials: json['socials'] != null
          ? Map<String, String>.from(json['socials'] as Map)
          : {},
      slots: json['slots'] != null
          ? (json['slots'] as List)
              .map((s) => CoachSlot.fromJson(s as Map<String, dynamic>))
              .toList()
          : null,
    );
  }
}

class CoachSlot {
  final String id;
  final DateTime startAt;
  final DateTime endAt;

  CoachSlot({
    required this.id,
    required this.startAt,
    required this.endAt,
  });

  factory CoachSlot.fromJson(Map<String, dynamic> json) {
    return CoachSlot(
      id: json['id'] as String,
      startAt: DateTime.parse(json['startAt'] as String),
      endAt: DateTime.parse(json['endAt'] as String),
    );
  }
}

class Booking {
  final String id;
  final Coach coach;
  final CoachSlot slot;
  final String type;
  final String status;
  final int price;
  final String currency;
  final DateTime createdAt;

  Booking({
    required this.id,
    required this.coach,
    required this.slot,
    required this.type,
    required this.status,
    required this.price,
    required this.currency,
    required this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as String,
      coach: Coach.fromJson(json['coach'] as Map<String, dynamic>),
      slot: CoachSlot.fromJson(json['slot'] as Map<String, dynamic>),
      type: json['type'] as String,
      status: json['status'] as String,
      price: json['price'] as int? ?? 0,
      currency: json['currency'] as String? ?? 'RUB',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

