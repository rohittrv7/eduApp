import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/screens/auth/login_screen.dart';
import 'package:alledu_mobile/screens/auth/otp_screen.dart';
import 'package:alledu_mobile/screens/dashboard/student_dashboard_screen.dart';
import 'package:alledu_mobile/screens/batches/batches_list_screen.dart';
import 'package:alledu_mobile/screens/batches/batch_details_screen.dart';
import 'package:alledu_mobile/screens/live/live_classes_list_screen.dart';
import 'package:alledu_mobile/screens/live/live_class_player_screen.dart';
import 'package:alledu_mobile/screens/doubts/doubts_forum_screen.dart';
import 'package:alledu_mobile/screens/doubts/ask_doubt_screen.dart';
import 'package:alledu_mobile/screens/profile/profile_screen.dart';

class AppNavigation {
  static final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();
  static final GlobalKey<NavigatorState> shellNavigatorKey = GlobalKey<NavigatorState>();

  static GoRouter getRouter(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return GoRouter(
      navigatorKey: rootNavigatorKey,
      initialLocation: '/login',
      refreshListenable: authProvider,
      
      // Authentication route guard/redirects
      redirect: (context, state) {
        final loggedIn = authProvider.isAuthenticated;
        final goingToAuth = state.matchedLocation == '/login' || state.matchedLocation == '/otp';
        
        if (!loggedIn && !goingToAuth) {
          return '/login';
        }
        if (loggedIn && goingToAuth) {
          return '/';
        }
        return null;
      },

      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/otp',
          builder: (context, state) => const OtpScreen(),
        ),
        
        // Navigation bar container shell route
        ShellRoute(
          navigatorKey: shellNavigatorKey,
          builder: (context, state, child) {
            return NavigationShellScaffold(child: child);
          },
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const StudentDashboardScreen(),
            ),
            GoRoute(
              path: '/batches',
              builder: (context, state) => const BatchesListScreen(),
              routes: [
                GoRoute(
                  path: ':batchId',
                  builder: (context, state) {
                    final batchId = state.pathParameters['batchId'] ?? '';
                    return BatchDetailsScreen(batchId: batchId);
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/live',
              builder: (context, state) => const LiveClassesListScreen(),
              routes: [
                GoRoute(
                  path: ':classId',
                  builder: (context, state) {
                    final classId = state.pathParameters['classId'] ?? '';
                    return LiveClassPlayerScreen(classId: classId);
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/doubts',
              builder: (context, state) => const DoubtsForumScreen(),
              routes: [
                GoRoute(
                  path: 'new',
                  builder: (context, state) => const AskDoubtScreen(),
                ),
              ],
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    );
  }
}

// Navigation Shell scaffolding holding BottomNavigationBar
class NavigationShellScaffold extends StatelessWidget {
  final Widget child;

  const NavigationShellScaffold({super.key, required this.child});

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/batches')) return 1;
    if (location.startsWith('/live')) return 2;
    if (location.startsWith('/doubts')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0; // Default dashboard
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/batches');
        break;
      case 2:
        context.go('/live');
        break;
      case 3:
        context.go('/doubts');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _calculateSelectedIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.grey.shade100, width: 1.5)),
        ),
        child: BottomNavigationBar(
          currentIndex: selectedIndex,
          onTap: (index) => _onItemTapped(index, context),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF2563EB),
          unselectedItemColor: Colors.grey.shade400,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined, size: 22),
              activeIcon: Icon(Icons.dashboard, size: 22),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.book_outlined, size: 22),
              activeIcon: Icon(Icons.book, size: 22),
              label: 'Batches',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.play_circle_outline, size: 22),
              activeIcon: Icon(Icons.play_circle, size: 22),
              label: 'Live',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.message_outlined, size: 22),
              activeIcon: Icon(Icons.message, size: 22),
              label: 'Doubts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline, size: 22),
              activeIcon: Icon(Icons.person, size: 22),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
