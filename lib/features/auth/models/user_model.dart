class UserModel {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String agentId;
  final double commissionRate;
  final String? profileImage;
  final String? city;

  const UserModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.agentId,
    required this.commissionRate,
    this.profileImage,
    this.city,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'],
      agentId: json['agent_id']?.toString() ?? 'AG001',
      commissionRate: (json['commission_rate'] ?? 4.0).toDouble(),
      profileImage: json['profile_image'],
      city: json['city'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'agent_id': agentId,
      'commission_rate': commissionRate,
      'profile_image': profileImage,
      'city': city,
    };
  }

  static UserModel get mock => const UserModel(
        id: 'u001',
        name: 'Rajesh Sharma',
        phone: '+919876543210',
        email: 'rajesh@example.com',
        agentId: 'AG-HYD-001',
        commissionRate: 4.0,
        city: 'Hyderabad',
      );

  String get firstName => name.split(' ').first;
}
