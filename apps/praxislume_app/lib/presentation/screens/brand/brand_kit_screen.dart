import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/utils/logo_helpers.dart';
import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../state/praxis_providers.dart';

class BrandKitScreen extends ConsumerStatefulWidget {
  const BrandKitScreen({super.key});

  @override
  ConsumerState<BrandKitScreen> createState() => _BrandKitScreenState();
}

class _BrandKitScreenState extends ConsumerState<BrandKitScreen> {
  late final TextEditingController _primaryColor;
  late final TextEditingController _cta;
  bool _uploadingLogo = false;

  @override
  void initState() {
    super.initState();
    final brand = ref.read(praxisProvider).brandKit;
    _primaryColor = TextEditingController(text: brand.primaryColor);
    _cta = TextEditingController(text: brand.defaultCta);
  }

  @override
  void dispose() {
    _primaryColor.dispose();
    _cta.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    return WorkspaceShell(
      title: 'Brand Settings',
      subtitle: 'Customize your identity and keep content consistent.',
      currentRoute: '/brand',
      primaryAction: FilledButton.icon(
        onPressed: () async => _save(context),
        icon: const Icon(Icons.save_outlined),
        label: const Text('Save Changes'),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 980;
          final form = Column(
            children: [
              PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Clinic Identity',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    _brandInfo(
                      'Clinic Name',
                      state.clinic?.name ?? 'Clinic name',
                    ),
                    _brandInfo(
                      'Doctor Name',
                      state.doctor?.name ?? 'Doctor name',
                    ),
                    _brandInfo(
                      'Specialty',
                      state.doctor?.specialty ?? 'Specialty',
                    ),
                    _brandInfo('Tone', state.brandKit.tone),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Logo', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        BrandLogoMark(
                          logoPath: state.brandKit.logoPath,
                          size: 58,
                          iconSize: 28,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            state.brandKit.logoPath ?? 'No logo uploaded',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton.icon(
                          key: const Key('logoUploadButton'),
                          onPressed: _uploadingLogo || state.clinic == null
                              ? null
                              : () async => _pickLogo(context),
                          icon: _uploadingLogo
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.upload_file_outlined),
                          label: const Text('Upload'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              PraxisCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Content Defaults',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () async => _save(context),
                        icon: const Icon(Icons.save_outlined),
                        label: const Text('Save brand kit'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      key: const Key('primaryColorField'),
                      controller: _primaryColor,
                      decoration: const InputDecoration(
                        labelText: 'Primary color',
                        prefixIcon: Icon(Icons.color_lens_outlined),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      key: const Key('ctaField'),
                      controller: _cta,
                      decoration: const InputDecoration(
                        labelText: 'Default CTA',
                        prefixIcon: Icon(Icons.campaign_outlined),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
          final preview = BrandPreview(state: state);
          if (!wide) {
            return Column(
              children: [form, const SizedBox(height: 16), preview],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 2, child: form),
              const SizedBox(width: 16),
              Expanded(child: preview),
            ],
          );
        },
      ),
    );
  }

  Widget _brandInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          SizedBox(
            width: 132,
            child: Text(label, style: const TextStyle(color: praxisMuted)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _save(BuildContext context) async {
    await ref
        .read(praxisProvider.notifier)
        .updateBrandKit(
          primaryColor: _primaryColor.text.trim(),
          defaultCta: _cta.text.trim(),
        );
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Brand kit saved')));
  }

  Future<void> _pickLogo(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _uploadingLogo = true);
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['png', 'jpg', 'jpeg', 'webp'],
        withData: true,
      );
      if (result == null) {
        return;
      }
      final file = result.files.single;
      final bytes = file.bytes;
      if (bytes == null) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Logo file could not be read')),
        );
        return;
      }
      final extension = normalizeLogoExtension(file.extension ?? '');
      await ref
          .read(praxisProvider.notifier)
          .uploadBrandLogo(
            bytes: bytes,
            fileExtension: extension,
            contentType: logoContentType(extension),
          );
      messenger.showSnackBar(const SnackBar(content: Text('Logo uploaded')));
    } catch (_) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Logo upload failed')),
      );
    } finally {
      if (mounted) {
        setState(() => _uploadingLogo = false);
      }
    }
  }
}

class BrandPreview extends StatelessWidget {
  const BrandPreview({required this.state, super.key});

  final PraxisState state;

  @override
  Widget build(BuildContext context) {
    final brandColor = parseBrandColor(state.brandKit.primaryColor);
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Live Preview', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: brandColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    BrandLogoMark(
                      logoPath: state.brandKit.logoPath,
                      size: 40,
                      iconSize: 21,
                      backgroundColor: Colors.white,
                      foregroundColor: praxisTealDark,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        state.clinic?.name ?? 'Clinic name',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                          letterSpacing: 0,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
                Text(
                  state.items.isEmpty
                      ? 'Patient Education'
                      : state.items.first.title.replaceFirst(
                          RegExp(r'^Day \d+: '),
                          '',
                        ),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    height: 1.05,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: praxisGold,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    state.brandKit.defaultCta,
                    style: const TextStyle(
                      color: praxisInk,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                Text(
                  state.brandKit.disclaimer,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.82)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class BrandLogoMark extends StatelessWidget {
  const BrandLogoMark({
    required this.logoPath,
    required this.size,
    required this.iconSize,
    this.backgroundColor = praxisMint,
    this.foregroundColor = praxisTealDark,
    super.key,
  });

  final String? logoPath;
  final double size;
  final double iconSize;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    final path = logoPath;
    if (path == null || path.isEmpty) {
      return _fallback();
    }
    return FutureBuilder<String?>(
      future: _signedLogoUrl(path),
      builder: (context, snapshot) {
        final url = snapshot.data;
        if (url == null || url.isEmpty) {
          return _fallback();
        }
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            url,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => _fallback(),
          ),
        );
      },
    );
  }

  Widget _fallback() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        Icons.local_hospital_outlined,
        color: foregroundColor,
        size: iconSize,
      ),
    );
  }

  Future<String?> _signedLogoUrl(String path) async {
    try {
      return await Supabase.instance.client.storage
          .from('clinic-logos')
          .createSignedUrl(path, 300);
    } catch (_) {
      return null;
    }
  }
}
