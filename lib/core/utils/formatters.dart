import 'package:intl/intl.dart';

class AppFormatters {
  AppFormatters._();

  static final _currencyFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static final _compactFormatter = NumberFormat.compact(locale: 'en_IN');

  static String currency(num amount) => _currencyFormatter.format(amount);

  static String compactCurrency(num amount) {
    if (amount >= 100000) {
      return '₹${(amount / 100000).toStringAsFixed(1)}L';
    } else if (amount >= 1000) {
      return '₹${(amount / 1000).toStringAsFixed(1)}K';
    }
    return '₹$amount';
  }

  static String formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('d MMM yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  static String formatDateTime(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('d MMM yyyy, hh:mm a').format(date.toLocal());
    } catch (_) {
      return dateStr;
    }
  }

  static String timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return DateFormat('d MMM').format(date);
    } catch (_) {
      return '';
    }
  }

  static String phoneDisplay(String phone) {
    // Format: +91 98765 43210
    if (phone.startsWith('+91') && phone.length == 13) {
      return '+91 ${phone.substring(3, 8)} ${phone.substring(8)}';
    }
    return phone;
  }
}
