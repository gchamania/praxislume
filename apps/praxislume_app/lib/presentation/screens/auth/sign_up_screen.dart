import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/environment_settings.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';
import 'auth_widgets.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _clinic = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    _clinic.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthSplitScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const PraxisLogo(),
          const SizedBox(height: 34),
          Text(
            'Create your account',
            style: Theme.of(context).textTheme.displaySmall,
          ),
          const SizedBox(height: 8),
          const Text('Start with the essentials for your clinic workspace.'),
          const SizedBox(height: 24),
          _authField(_name, 'Full Name', Icons.person_outline),
          _authField(_email, 'Email Address', Icons.mail_outline),
          _authField(_phone, 'Phone Number', Icons.phone_outlined),
          _authField(_password, 'Password', Icons.lock_outline, obscure: true),
          _authField(
            _confirm,
            'Confirm Password',
            Icons.lock_outline,
            obscure: true,
          ),
          _authField(
            _clinic,
            'Clinic / Practice Name',
            Icons.local_hospital_outlined,
          ),
          const SizedBox(height: 8),
          const PraxisChip(
            label: 'Doctor workspace',
            icon: Icons.medical_services_outlined,
            color: praxisMint,
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: () => _authenticate(createAccount: true),
            child: const Text('Create PraxisLume Account'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/signin'),
            child: const Text('Already have an account? Sign in'),
          ),
        ],
      ),
    );
  }

  Widget _authField(
    TextEditingController controller,
    String label,
    IconData icon, {
    bool obscure = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
      ),
    );
  }

  Future<void> _authenticate({required bool createAccount}) async {
    final settings = SupabaseSettings.fromEnvironment();
    if (!settings.isConfigured) {
      _showMessage('Supabase is not configured for this build');
      return;
    }
    if (_password.text != _confirm.text) {
      _showMessage('Passwords do not match');
      return;
    }
    try {
      await Supabase.instance.client.auth.signUp(
        email: _email.text.trim(),
        password: _password.text,
      );
      await ref.read(praxisProvider.notifier).load();
      if (!mounted) {
        return;
      }
      context.go('/onboarding');
    } on AuthException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Account creation failed');
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
