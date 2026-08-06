import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:alledu_mobile/providers/auth_provider.dart';
import 'package:alledu_mobile/screens/auth/login_screen.dart';
import 'package:alledu_mobile/screens/auth/otp_screen.dart';
import 'package:alledu_mobile/screens/dashboard/student_dashboard_screen.dart';
import 'package:alledu_mobile/screens/dashboard/teacher_dashboard_screen.dart';
import 'package:alledu_mobile/screens/dashboard/admin_dashboard_screen.dart';
import 'package:alledu_mobile/screens/admin/admin_students_screen.dart';
import 'package:alledu_mobile/screens/admin/admin_teachers_screen.dart';
import 'package:alledu_mobile/screens/admin/admin_live_classes_screen.dart';
import 'package:alledu_mobile/screens/admin/admin_revenue_screen.dart';
import 'package:alledu_mobile/screens/admin/admin_settings_screen.dart';
import 'package:alledu_mobile/screens/batches/batches_list_screen.dart';
import 'package:alledu_mobile/screens/batches/batch_details_screen.dart';
import 'package:alledu_mobile/screens/live/live_classes_list_screen.dart';
import 'package:alledu_mobile/screens/live/live_class_player_screen.dart';
import 'package:alledu_mobile/screens/doubts/doubts_forum_screen.dart';
import 'package:alledu_mobile/screens/doubts/ask_doubt_screen.dart';
import 'package:alledu_mobile/screens/quizzes/quizzes_list_screen.dart';
import 'package:alledu_mobile/screens/quizzes/quiz_take_screen.dart';
import 'package:alledu_mobile/screens/quizzes/create_quiz_screen.dart';
import 'package:alledu_mobile/screens/profile/profile_screen.dart';
import 'package:alledu_mobile/screens/leaderboard/leaderboard_screen.dart';
import 'package:alledu_mobile/screens/announcements/announcements_screen.dart';
import 'package:alledu_mobile/screens/videos/video_player_screen.dart';
import 'package:alledu_mobile/config/theme.dart';

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
        
        // Admin Console Dedicated Management Screens
        GoRoute(
          path: '/admin/students',
          builder: (context, state) => const AdminStudentsScreen(),
        ),
        GoRoute(
          path: '/admin/teachers',
          builder: (context, state) => const AdminTeachersScreen(),
        ),
        GoRoute(
          path: '/admin/live-classes',
          builder: (context, state) => const AdminLiveClassesScreen(),
        ),
        GoRoute(
          path: '/admin/revenue',
          builder: (context, state) => const AdminRevenueScreen(),
        ),
        GoRoute(
          path: '/admin/settings',
          builder: (context, state) => const AdminSettingsScreen(),
        ),
        
        // Quizzes & Tests routes
        GoRoute(
          path: '/quizzes/create',
          builder: (context, state) => const CreateQuizScreen(),
        ),
        GoRoute(
          path: '/quizzes/:quizId',
          builder: (context, state) {
            final quizId = state.pathParameters['quizId'] ?? '';
            return QuizTakeScreen(quizId: quizId);
          },
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
              builder: (context, state) {
                final userRole = authProvider.user?.role;
                if (userRole == 'teacher') {
                  return const TeacherDashboardScreen();
                } else if (userRole == 'admin') {
                  return const AdminDashboardScreen();
                }
                return const StudentDashboardScreen();
              },
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
              path: '/quizzes',
              builder: (context, state) => const QuizzesListScreen(),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
            GoRoute(
              path: '/leaderboard',
              builder: (context, state) => const LeaderboardScreen(),
            ),
            GoRoute(
              path: '/announcements',
              builder: (context, state) => const AnnouncementsScreen(),
            ),
            GoRoute(
              path: '/videos/:videoId',
              builder: (context, state) {
                final videoId = state.pathParameters['videoId'] ?? '';
                return VideoPlayerScreen(videoId: videoId);
              },
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

  int _calculateSelectedIndex(BuildContext context, bool isAdmin) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/batches')) return 1;
    if (location.startsWith('/live')) return 2;
    if (isAdmin) {
      if (location.startsWith('/admin/students') || location.startsWith('/doubts')) return 3;
    } else {
      if (location.startsWith('/doubts')) return 3;
    }
    if (location.startsWith('/profile')) return 4;
    return 0; // Default dashboard
  }

  void _onItemTapped(int index, BuildContext context, bool isAdmin, String? role) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/batches');
        break;
      case 2:
        if (isAdmin) {
          context.go('/admin/live-classes');
        } else {
          context.go('/live');
        }
        break;
      case 3:
        if (isAdmin) {
          context.go('/admin/students');
        } else {
          context.go('/doubts');
        }
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final userRole = auth.user?.role;
    final isAdmin = userRole == 'admin';
    final selectedIndex = _calculateSelectedIndex(context, isAdmin);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
        } else {
          final selectedIndex = _calculateSelectedIndex(context, isAdmin);
          if (selectedIndex != 0) {
            context.go('/');
          } else {
            SystemNavigator.pop();
          }
        }
      },
      child: Scaffold(
        body: child,
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: Colors.grey.shade200, width: 1.0)),
          ),
          child: BottomNavigationBar(
            currentIndex: selectedIndex,
            onTap: (index) => _onItemTapped(index, context, isAdmin, userRole),
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.white,
            selectedItemColor: isAdmin ? const Color(0xFF7C3AED) : AppTheme.primary,
            unselectedItemColor: Colors.grey.shade400,
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
            unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.dashboard_outlined, size: 22),
                activeIcon: Icon(Icons.dashboard, size: 22),
                label: 'Home',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.book_outlined, size: 22),
                activeIcon: Icon(Icons.book, size: 22),
                label: 'Batches',
              ),
              BottomNavigationBarItem(
                icon: Icon(isAdmin ? Icons.videocam_outlined : Icons.play_circle_outline, size: 22),
                activeIcon: Icon(isAdmin ? Icons.videocam : Icons.play_circle, size: 22),
                label: isAdmin ? 'Moderation' : 'Live',
              ),
              BottomNavigationBarItem(
                icon: Icon(isAdmin ? Icons.people_outline : Icons.message_outlined, size: 22),
                activeIcon: Icon(isAdmin ? Icons.people : Icons.message, size: 22),
                label: isAdmin ? 'Students' : 'Doubts',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.person_outline, size: 22),
                activeIcon: Icon(Icons.person, size: 22),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
