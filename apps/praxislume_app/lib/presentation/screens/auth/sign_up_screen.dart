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
          const SizedBox(height: 8),
          const Text(
            'Clinic content. Patient growth.',
            style: TextStyle(
              color: praxisText,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 42),
          Text(
            'Create your account',
            style: Theme.of(context).textTheme.displaySmall,
          ),
          const SizedBox(height: 8),
          const Text('Join doctors growing their practice with smart content.'),
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
          Text(
            'I am signing up as',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          const Row(
            children: [
              Expanded(
                child: _RoleCard(
                  selected: true,
                  icon: Icons.medical_services_outlined,
                  title: 'Doctor',
                  body: 'I am the doctor or specialist',
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _RoleCard(
                  selected: false,
                  icon: Icons.business_center_outlined,
                  title: 'Clinic Manager',
                  body: 'I manage clinic operations',
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _RoleCard(
                  selected: false,
                  icon: Icons.support_agent_outlined,
                  title: 'Receptionist',
                  body: 'I handle front desk and content',
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Checkbox(value: true, onChanged: (_) {}),
              const Expanded(
                child: Text(
                  'I agree to the Terms of Service and Privacy Policy',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () => _authenticate(createAccount: true),
            child: const Text('Create PraxisLume Account'),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: Container(height: 1, color: praxisLine)),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text('or continue with'),
              ),
              Expanded(child: Container(height: 1, color: praxisLine)),
            ],
          ),
          const SizedBox(height: 12),
          const Row(
            children: [
              Expanded(child: _SocialMiniButton(label: 'Google')),
              SizedBox(width: 10),
              Expanded(child: _SocialMiniButton(label: 'Facebook')),
              SizedBox(width: 10),
              Expanded(child: _SocialMiniButton(label: 'Apple')),
            ],
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

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.selected,
    required this.icon,
    required this.title,
    required this.body,
  });

  final bool selected;
  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 112),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: selected ? praxisMint.withValues(alpha: 0.5) : praxisSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: selected ? praxisTeal : praxisLine),
      ),
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? praxisPurple : praxisMuted,
              size: 18,
            ),
          ),
          Icon(icon, color: praxisText),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _SocialMiniButton extends StatelessWidget {
  const _SocialMiniButton({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(onPressed: () {}, child: Text(label));
  }
}
