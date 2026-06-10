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

  factory UserModel.fromFirestore(String uid, Map<String, dynamic> data) {
    return UserModel(
      id: uid,
      name: data['name'] ?? '',
      phone: data['phone'] ?? '',
      email: data['email'],
      agentId: data['agentId'] ?? uid,
      commissionRate: (data['commissionRate'] ?? 4.0).toDouble(),
      profileImage: data['profileImage'],
      city: data['city'],
    );
  }

  // Called when a new Firebase user signs in for the first time
  factory UserModel.newFromUid(String uid, String phone) {
    return UserModel(
      id: uid,
      name: '',
      phone: phone,
      agentId: uid,
      commissionRate: 4.0,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'phone': phone,
      if (email != null) 'email': email,
      'agentId': agentId,
      'commissionRate': commissionRate,
      if (profileImage != null) 'profileImage': profileImage,
      if (city != null) 'city': city,
    };
  }

  String get firstName => name.isNotEmpty ? name.split(' ').first : 'Agent';
}
