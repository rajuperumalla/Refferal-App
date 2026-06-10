class UserModel {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String agentId;
  final double commissionRate;
  final String? profileImage;
  final String? city;
  final String role;       // 'agent' | 'manager' | 'admin'
  final String? managerId; // set for agents — which manager they report to

  const UserModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.agentId,
    required this.commissionRate,
    this.profileImage,
    this.city,
    this.role = 'agent',
    this.managerId,
  });

  bool get isAgent   => role == 'agent';
  bool get isManager => role == 'manager';
  bool get isAdmin   => role == 'admin';

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
      role: json['role'] ?? 'agent',
      managerId: json['manager_id'],
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
      'role': role,
      'manager_id': managerId,
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
      role: data['role'] ?? 'agent',
      managerId: data['managerId'],
    );
  }

  factory UserModel.newFromUid(String uid, String phone) {
    return UserModel(
      id: uid,
      name: '',
      phone: phone,
      agentId: uid,
      commissionRate: 4.0,
      role: 'agent',
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
      'role': role,
      if (managerId != null) 'managerId': managerId,
    };
  }

  String get firstName => name.isNotEmpty ? name.split(' ').first : 'Agent';
}
