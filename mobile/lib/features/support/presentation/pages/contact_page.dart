import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inskate/core/config/api_config.dart';
import 'package:inskate/core/services/api_client.dart';
import 'package:inskate/core/theme/app_theme.dart';
import 'package:inskate/features/auth/providers/auth_provider.dart';

class ContactPage extends ConsumerStatefulWidget {
  final String? lessonId;

  const ContactPage({super.key, this.lessonId});

  @override
  ConsumerState<ContactPage> createState() => _ContactPageState();
}

class _ContactPageState extends ConsumerState<ContactPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isLoading = false;
  String _selectedTopic = 'general';

  @override
  void initState() {
    super.initState();
    // Pre-fill with user data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(currentUserProvider);
      if (user != null) {
        _nameController.text = user.name ?? '';
        _phoneController.text = user.phone;
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final api = ref.read(apiClientProvider);
      final user = ref.read(currentUserProvider);

      if (user != null) {
        // Create support ticket for authenticated user
        await api.post('${ApiConfig.support}/tickets', data: {
          'topic': _getTopicName(_selectedTopic),
          'message': _messageController.text,
          if (widget.lessonId != null) 'lessonId': widget.lessonId,
        });
      } else {
        // Use contact form for guests
        await api.post(ApiConfig.contact, data: {
          'name': _nameController.text,
          'phone': _phoneController.text,
          'message': _messageController.text,
          if (widget.lessonId != null) 'lessonId': widget.lessonId,
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Сообщение отправлено! Мы свяжемся с вами.'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка: $e'),
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

  String _getTopicName(String topic) {
    switch (topic) {
      case 'trial':
        return 'Запись на пробную тренировку';
      case 'subscription':
        return 'Вопрос по подписке';
      case 'lesson':
        return 'Вопрос по уроку';
      default:
        return 'Общий вопрос';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Связаться с нами'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Topic selection
              Text(
                'Тема обращения',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Общий вопрос'),
                    selected: _selectedTopic == 'general',
                    onSelected: (_) => setState(() => _selectedTopic = 'general'),
                  ),
                  ChoiceChip(
                    label: const Text('Пробная тренировка'),
                    selected: _selectedTopic == 'trial',
                    onSelected: (_) => setState(() => _selectedTopic = 'trial'),
                  ),
                  ChoiceChip(
                    label: const Text('Подписка'),
                    selected: _selectedTopic == 'subscription',
                    onSelected: (_) => setState(() => _selectedTopic = 'subscription'),
                  ),
                  if (widget.lessonId != null)
                    ChoiceChip(
                      label: const Text('Вопрос по уроку'),
                      selected: _selectedTopic == 'lesson',
                      onSelected: (_) => setState(() => _selectedTopic = 'lesson'),
                    ),
                ],
              ),

              const SizedBox(height: 24),

              // Name field (only for guests)
              if (user == null) ...[
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Ваше имя',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Введите имя';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Телефон',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                  keyboardType: TextInputType.phone,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Введите телефон';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
              ],

              // Message field
              TextFormField(
                controller: _messageController,
                decoration: const InputDecoration(
                  labelText: 'Сообщение',
                  alignLabelWithHint: true,
                ),
                maxLines: 5,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Введите сообщение';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 24),

              // Submit button
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Отправить'),
              ),

              const SizedBox(height: 16),

              // Or contact via messenger
              Text(
                'Или свяжитесь с нами в мессенджере',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.send),
                    label: const Text('Telegram'),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.chat),
                    label: const Text('WhatsApp'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

