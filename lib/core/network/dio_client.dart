import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class DioClient {
  static Dio? _dio;

  static Dio get instance {
    _dio ??= _createDio();
    return _dio!;
  }

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(milliseconds: ApiConstants.connectTimeout),
        receiveTimeout: const Duration(milliseconds: ApiConstants.receiveTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.addAll([
      _AuthInterceptor(),
      _LoggingInterceptor(),
      _ErrorInterceptor(),
    ]);

    return dio;
  }

  static void resetInstance() {
    _dio = null;
  }
}

class _AuthInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(ApiConstants.tokenKey);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      // Token expired - clear storage and redirect to login
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      // Could navigate to login here via a global navigator key
    }
    handler.next(err);
  }
}

class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('→ ${options.method} ${options.path}');
      if (options.data != null) debugPrint('  Body: ${options.data}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('← ${response.statusCode} ${response.requestOptions.path}');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint('✗ ${err.response?.statusCode} ${err.requestOptions.path}');
      debugPrint('  Error: ${err.message}');
    }
    handler.next(err);
  }
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final error = _handleError(err);
    handler.reject(error);
  }

  DioException _handleError(DioException err) {
    String message;
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'Connection timed out. Please try again.';
        break;
      case DioExceptionType.connectionError:
        message = 'No internet connection. Please check your network.';
        break;
      case DioExceptionType.badResponse:
        message = err.response?.data?['error']?['message'] ??
            'Server error. Please try again.';
        break;
      default:
        message = 'Something went wrong. Please try again.';
    }
    return DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: message,
    );
  }
}

// Mock API for demo without backend
class MockApiService {
  static Future<Map<String, dynamic>> getDashboardData() async {
    await Future.delayed(const Duration(milliseconds: 800));
    return {
      'success': true,
      'data': {
        'stats': {
          'current_month_commission': 45230,
          'pending_commission': 8400,
          'active_patients': 12,
          'pending_surgeries': 3,
          'conversion_rate': 68,
          'avg_commission': 3769,
          'total_earnings': 234500,
        },
        'recent_activity': [
          {
            'id': 1,
            'patient_name': 'Ramesh Kumar',
            'event': 'Surgery completed',
            'timestamp': '2024-05-20T10:30:00Z',
            'type': 'surgery',
          },
          {
            'id': 2,
            'patient_name': 'Priya Sharma',
            'event': 'OPD scheduled',
            'timestamp': '2024-05-20T09:15:00Z',
            'type': 'opd',
          },
          {
            'id': 3,
            'patient_name': null,
            'event': 'New commission credited ₹4,200',
            'timestamp': '2024-05-19T16:45:00Z',
            'type': 'commission',
          },
          {
            'id': 4,
            'patient_name': 'Suresh Rao',
            'event': 'IPD Admission confirmed',
            'timestamp': '2024-05-19T14:00:00Z',
            'type': 'ipd',
          },
        ],
      },
    };
  }

  static Future<List<Map<String, dynamic>>> getPatients({
    String status = 'all',
    String search = '',
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));
    final patients = [
      {
        'id': 101,
        'name': 'Ramesh Kumar',
        'phone': '+919876543210',
        'age': 45,
        'gender': 'M',
        'specialty': 'Ortho',
        'procedure': 'Knee Replacement',
        'status': 'ipd_confirmed',
        'expected_commission': 4500,
        'surgery_date': '2024-05-25',
        'city': 'Hyderabad',
        'hospital': 'Apollo Hospitals',
        'doctor': 'Dr. Suresh Reddy',
        'package_cost': 120000,
        'commission_percent': 3.75,
        'created_at': '2024-05-10T09:00:00Z',
        'last_updated': '2024-05-20T14:30:00Z',
        'opd_date': '2024-05-15',
        'discharge_date': '2024-05-28',
        'notes': 'Patient prefers morning slot. Has diabetes - needs special care.',
        'urgency': 'Within a week',
        'budget_range': '1L-2L',
        'insurance': false,
      },
      {
        'id': 102,
        'name': 'Priya Sharma',
        'phone': '+919765432109',
        'age': 35,
        'gender': 'F',
        'specialty': 'Urology',
        'procedure': 'Stone Removal',
        'status': 'opd_scheduled',
        'expected_commission': 3900,
        'surgery_date': null,
        'city': 'Bangalore',
        'hospital': 'Manipal Hospital',
        'doctor': 'Dr. Anil Mehta',
        'package_cost': 80000,
        'commission_percent': 4.0,
        'created_at': '2024-05-12T11:00:00Z',
        'last_updated': '2024-05-18T10:15:00Z',
        'opd_date': '2024-05-22',
        'urgency': 'Within a month',
        'budget_range': '50k-1L',
        'insurance': true,
        'insurance_provider': 'Star Health',
        'notes': '',
      },
      {
        'id': 103,
        'name': 'Suresh Rao',
        'phone': '+919654321098',
        'age': 52,
        'gender': 'M',
        'specialty': 'Cardiology',
        'procedure': 'Angioplasty',
        'status': 'new',
        'expected_commission': 8000,
        'surgery_date': null,
        'city': 'Chennai',
        'hospital': null,
        'doctor': null,
        'package_cost': 200000,
        'commission_percent': 4.0,
        'created_at': '2024-05-20T08:00:00Z',
        'last_updated': '2024-05-20T08:00:00Z',
        'urgency': 'Immediate',
        'budget_range': 'Above 2L',
        'insurance': true,
        'insurance_provider': 'HDFC ERGO',
        'notes': 'Urgent case - chest pain reported',
      },
      {
        'id': 104,
        'name': 'Meena Devi',
        'phone': '+919543210987',
        'age': 28,
        'gender': 'F',
        'specialty': 'Gynecology',
        'procedure': 'Laparoscopy',
        'status': 'contacted',
        'expected_commission': 2800,
        'surgery_date': null,
        'city': 'Mumbai',
        'hospital': 'Kokilaben Hospital',
        'doctor': null,
        'package_cost': 70000,
        'commission_percent': 4.0,
        'created_at': '2024-05-08T13:00:00Z',
        'last_updated': '2024-05-14T11:30:00Z',
        'urgency': 'Flexible',
        'budget_range': '50k-1L',
        'insurance': false,
        'notes': '',
      },
      {
        'id': 105,
        'name': 'Vijay Patel',
        'phone': '+919432109876',
        'age': 60,
        'gender': 'M',
        'specialty': 'General Surgery',
        'procedure': 'Gallbladder Removal',
        'status': 'completed',
        'expected_commission': 3200,
        'actual_commission': 3200,
        'surgery_date': '2024-05-01',
        'city': 'Delhi',
        'hospital': 'Fortis Hospital',
        'doctor': 'Dr. Ravi Gupta',
        'package_cost': 80000,
        'commission_percent': 4.0,
        'created_at': '2024-04-20T09:00:00Z',
        'last_updated': '2024-05-10T16:00:00Z',
        'urgency': 'Within a week',
        'budget_range': '50k-1L',
        'insurance': false,
        'notes': 'Surgery completed successfully',
      },
      {
        'id': 106,
        'name': 'Kavitha Reddy',
        'phone': '+919321098765',
        'age': 42,
        'gender': 'F',
        'specialty': 'ENT',
        'procedure': 'Tonsillectomy',
        'status': 'lost',
        'expected_commission': 1500,
        'surgery_date': null,
        'city': 'Hyderabad',
        'hospital': null,
        'doctor': null,
        'package_cost': 35000,
        'commission_percent': 4.0,
        'created_at': '2024-04-25T10:00:00Z',
        'last_updated': '2024-05-05T09:00:00Z',
        'urgency': 'Within a month',
        'budget_range': 'Below 50k',
        'insurance': false,
        'notes': 'Patient opted for government hospital',
      },
    ];

    if (search.isNotEmpty) {
      return patients
          .where((p) =>
              p['name'].toString().toLowerCase().contains(search.toLowerCase()) ||
              p['phone'].toString().contains(search))
          .toList()
          .cast<Map<String, dynamic>>();
    }

    if (status == 'all') return patients.cast<Map<String, dynamic>>();

    return patients
        .where((p) => p['status'] == status)
        .toList()
        .cast<Map<String, dynamic>>();
  }

  static Future<Map<String, dynamic>> getCommissionSummary() async {
    await Future.delayed(const Duration(milliseconds: 700));
    return {
      'current_month': 45230,
      'previous_month': 40380,
      'growth_percent': 12,
      'pending': 8400,
      'total_earned': 234500,
      'monthly_data': [
        {'month': 'Dec', 'amount': 28000},
        {'month': 'Jan', 'amount': 32000},
        {'month': 'Feb', 'amount': 35500},
        {'month': 'Mar', 'amount': 38200},
        {'month': 'Apr', 'amount': 40380},
        {'month': 'May', 'amount': 45230},
      ],
      'top_procedures': [
        {'procedure': 'Knee Replacement', 'amount': 18200},
        {'procedure': 'Gallbladder Surgery', 'amount': 9600},
        {'procedure': 'Cataract Surgery', 'amount': 7200},
        {'procedure': 'Stone Removal', 'amount': 6800},
      ],
    };
  }

  static Future<List<Map<String, dynamic>>> getPendingCommissions() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      {
        'id': 1,
        'patient_name': 'Ramesh Kumar',
        'procedure': 'Knee Replacement',
        'amount': 4500,
        'status': 'Surgery completed',
        'stage': 'Awaiting bill verification',
        'est_payout': '5 June 2024',
      },
      {
        'id': 2,
        'patient_name': 'Priya Sharma',
        'procedure': 'Stone Removal',
        'amount': 3900,
        'status': 'Bill submitted',
        'stage': 'Awaiting finance approval',
        'est_payout': '8 June 2024',
      },
    ];
  }

  static Future<List<Map<String, dynamic>>> getNotifications() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return [
      {
        'id': 1,
        'type': 'commission',
        'title': 'Commission Credited',
        'body': '₹4,500 for Ramesh Kumar case has been credited to your account',
        'timestamp': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
        'is_read': false,
      },
      {
        'id': 2,
        'type': 'patient_update',
        'title': 'Patient Status Update',
        'body': 'Priya Sharma - Surgery completed successfully',
        'timestamp': DateTime.now().subtract(const Duration(hours: 5)).toIso8601String(),
        'is_read': false,
      },
      {
        'id': 3,
        'type': 'appointment',
        'title': 'OPD Appointment Reminder',
        'body': 'Suresh Rao has OPD tomorrow at Apollo Hospitals, 10:00 AM',
        'timestamp': DateTime.now().subtract(const Duration(hours: 12)).toIso8601String(),
        'is_read': true,
      },
      {
        'id': 4,
        'type': 'alert',
        'title': 'Action Required',
        'body': 'Please upload documents for Meena Devi to proceed with IPD',
        'timestamp': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
        'is_read': true,
      },
      {
        'id': 5,
        'type': 'commission',
        'title': 'Commission Processed',
        'body': '₹12,300 for 3 cases paid via Bank Transfer. UTR: HDFC240520XXXX',
        'timestamp': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
        'is_read': true,
      },
    ];
  }
}
