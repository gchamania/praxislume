import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/environment_settings.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';
import 'auth_widgets.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthSplitScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const PraxisLogo(),
          const SizedBox(height: 26),
          const Text(
            'Your Doctor Growth OS.',
            style: TextStyle(
              color: praxisTealDark,
              fontSize: 16,
              fontWeight: FontWeight.w900,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 16),
          Text('Welcome back', style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 8),
          const Text('Sign in to continue'),
          const SizedBox(height: 20),
          TextField(
            key: const Key('emailField'),
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.mail_outline),
              hintText: 'Enter your email',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('passwordField'),
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Password',
              prefixIcon: Icon(Icons.lock_outline),
              suffixIcon: Icon(Icons.visibility_off_outlined),
              hintText: 'Enter your password',
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {},
              child: const Text('Forgot password?'),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () => _authenticate(createAccount: false),
            child: const Text('Sign in'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => context.go('/signup'),
            child: const Text('Create account'),
          ),
          const SizedBox(height: 6),
          TextButton(
            onPressed: _signInDemo,
            child: const Text('Use demo account'),
          ),
          const SizedBox(height: 16),
          const SecurityNotice(),
        ],
      ),
    );
  }

  Future<void> _signInDemo() async {
    await ref.read(praxisProvider.notifier).signInDemo();
    if (!mounted) {
      return;
    }
    final state = ref.read(praxisProvider);
    context.go(state.onboardingComplete ? '/dashboard' : '/onboarding');
  }

  Future<void> _authenticate({required bool createAccount}) async {
    final settings = SupabaseSettings.fromEnvironment();
    if (!settings.isConfigured) {
      _showMessage('Supabase is not configured for this build');
      return;
    }

    try {
      final auth = Supabase.instance.client.auth;
      if (createAccount) {
        await auth.signUp(email: _email.text.trim(), password: _password.text);
      } else {
        await auth.signInWithPassword(
          email: _email.text.trim(),
          password: _password.text,
        );
      }
      await ref.read(praxisProvider.notifier).load();
      if (!mounted) {
        return;
      }
      final state = ref.read(praxisProvider);
      context.go(state.onboardingComplete ? '/dashboard' : '/onboarding');
    } on AuthException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Sign in failed');
    }
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}
