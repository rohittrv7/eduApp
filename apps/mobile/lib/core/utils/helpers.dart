import 'package:intl/intl.dart';

class UIHelpers {
  static String formatINR(num amount) {
    final format = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return format.format(amount);
  }

  static String formatWatchTime(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    if (h > 0) {
      return '${h}h ${m}m';
    }
    return '${m}m';
  }

  static String formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (_) {
      return '';
    }
  }

  static String formatTime(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('hh:mm a').format(date);
    } catch (_) {
      return '';
    }
  }
}
