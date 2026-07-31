import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/providers/batch_provider.dart';
import 'package:alledu_mobile/providers/doubt_provider.dart';
import 'package:alledu_mobile/providers/dashboard_provider.dart';
import 'package:alledu_mobile/providers/quiz_provider.dart';
import 'package:alledu_mobile/core/navigation/router.dart';
import 'package:alledu_mobile/config/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BatchProvider()),
        ChangeNotifierProvider(create: (_) => DoubtProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
        ChangeNotifierProvider(create: (_) => QuizProvider()),
      ],
      child: Builder(
        builder: (context) {
          final router = AppNavigation.getRouter(context);
          return MaterialApp.router(
            title: 'allEdu',
            theme: AppTheme.lightTheme,
            routerConfig: router,
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
