import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/auth/providers/auth_provider.dart';

class PhoneInputPage extends ConsumerStatefulWidget {
  const PhoneInputPage({super.key});

  @override
  ConsumerState<PhoneInputPage> createState() => _PhoneInputPageState();
}

class _PhoneInputPageState extends ConsumerState<PhoneInputPage> {
  final _formKey = GlobalKey<FormState>();
  String _phone = '';
  bool _isLoading = false;
  bool _isValid = false;

  Future<void> _sendCode() async {
    if (!_isValid) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(authStateProvider.notifier).sendCode(_phone);
      if (mounted) {
        context.push('/auth/otp', extra: _phone);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка отправки кода: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),
                // Logo
                Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text(
                        '⛸️',
                        style: TextStyle(fontSize: 48),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  'Добро пожаловать\nв InSkate',
                  style: Theme.of(context).textTheme.displaySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Введите номер телефона для входа',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                // Phone input
                IntlPhoneField(
                  decoration: const InputDecoration(
                    labelText: 'Номер телефона',
                    border: OutlineInputBorder(),
                  ),
                  initialCountryCode: 'RU',
                  languageCode: 'ru',
                  onChanged: (phone) {
                    setState(() {
                      _phone = phone.completeNumber;
                      _isValid = phone.isValidNumber();
                    });
                  },
                  onCountryChanged: (country) {},
                ),
                const SizedBox(height: 24),
                // Submit button
                ElevatedButton(
                  onPressed: _isValid && !_isLoading ? _sendCode : null,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Получить код'),
                ),
                const SizedBox(height: 24),
                Text(
                  'Нажимая кнопку, вы соглашаетесь с условиями использования и политикой конфиденциальности',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

