import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../ui/praxis_components.dart';
import '../../state/praxis_providers.dart';
import '../../shared/content_helpers.dart';

class ContentDetailScreen extends ConsumerStatefulWidget {
  const ContentDetailScreen({required this.itemId, super.key});

  final String itemId;

  @override
  ConsumerState<ContentDetailScreen> createState() =>
      _ContentDetailScreenState();
}

class _ContentDetailScreenState extends ConsumerState<ContentDetailScreen> {
  late final TextEditingController _caption;
  bool _postPackageCopied = false;
  bool _thumbnailGenerating = false;
  String? _thumbnailError;

  @override
  void initState() {
    super.initState();
    final item = ref
        .read(praxisProvider)
        .items
        .firstWhere((candidate) => candidate.id == widget.itemId);
    _caption = TextEditingController(text: item.caption);
  }

  @override
  void dispose() {
    _caption.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = ref
        .watch(praxisProvider)
        .items
        .firstWhere((candidate) => candidate.id == widget.itemId);
    final asset = ref.watch(praxisProvider).visualAssetsByContentId[item.id];
    final canGenerateThumbnail = ref
        .read(praxisProvider.notifier)
        .hasGenerationClient;
    return WorkspaceShell(
      title: item.title,
      subtitle: 'Review, edit and manually export this content package.',
      currentRoute: '/library',
      child: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth > 900;
          final editor = PraxisCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Caption', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                TextField(
                  key: const Key('captionField'),
                  controller: _caption,
                  maxLines: 8,
                  decoration: const InputDecoration(
                    labelText: 'Caption',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    FilledButton(
                      onPressed: () async {
                        await ref
                            .read(praxisProvider.notifier)
                            .updateContentItem(item.id, caption: _caption.text);
                        if (!context.mounted) {
                          return;
                        }
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Content item saved')),
                        );
                      },
                      child: const Text('Save item'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () {
                        final updated = ref
                            .read(praxisProvider)
                            .items
                            .firstWhere(
                              (candidate) => candidate.id == widget.itemId,
                            );
                        final package =
                            'Title: ${updated.title}\nCaption: ${updated.caption}\nCTA: ${updated.shortCta}\nReel script: ${updated.reelScript}';
                        Clipboard.setData(ClipboardData(text: package));
                        setState(() => _postPackageCopied = true);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Post package copied')),
                        );
                      },
                      icon: const Icon(Icons.copy),
                      label: const Text('Copy post package'),
                    ),
                  ],
                ),
                if (_postPackageCopied) ...[
                  const SizedBox(height: 12),
                  const PraxisChip(
                    label: 'Post package copied',
                    icon: Icons.check,
                  ),
                ],
              ],
            ),
          );
          final preview = PraxisCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MedicalThumbnail(
                  title: item.title,
                  category: item.category,
                  index: item.dayOffset,
                  aspectRatio: 1.15,
                ),
                const SizedBox(height: 14),
                PraxisChip(
                  label: categoryLabel(item.category),
                  color: contentCategoryTint(item.category),
                ),
                const SizedBox(height: 12),
                Text(item.title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text('CTA: ${item.shortCta}'),
                const SizedBox(height: 8),
                Text(item.reelScript),
                const SizedBox(height: 16),
                if (asset == null)
                  _ThumbnailGenerationPanel(
                    enabled: canGenerateThumbnail,
                    loading: _thumbnailGenerating,
                    error: _thumbnailError,
                    onGenerate: canGenerateThumbnail
                        ? () async {
                            setState(() {
                              _thumbnailGenerating = true;
                              _thumbnailError = null;
                            });
                            try {
                              final generated = await ref
                                  .read(praxisProvider.notifier)
                                  .generateVisualAssetForItem(item.id);
                              if (!context.mounted) {
                                return;
                              }
                              if (generated == null) {
                                setState(
                                  () => _thumbnailError =
                                      'AI thumbnail generation requires backend API.',
                                );
                                return;
                              }
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('AI thumbnail ready'),
                                ),
                              );
                            } catch (_) {
                              if (!context.mounted) {
                                return;
                              }
                              setState(
                                () => _thumbnailError =
                                    'AI thumbnail unavailable. Try again after checking API settings.',
                              );
                            } finally {
                              if (mounted) {
                                setState(() => _thumbnailGenerating = false);
                              }
                            }
                          }
                        : null,
                  )
                else
                  _GeneratedThumbnailPreview(signedUrl: asset.signedUrl),
              ],
            ),
          );
          if (!wide) {
            return Column(
              children: [editor, const SizedBox(height: 16), preview],
            );
          }
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: preview),
              const SizedBox(width: 16),
              Expanded(flex: 2, child: editor),
            ],
          );
        },
      ),
    );
  }
}

class _ThumbnailGenerationPanel extends StatelessWidget {
  const _ThumbnailGenerationPanel({
    required this.enabled,
    required this.loading,
    required this.onGenerate,
    this.error,
  });

  final bool enabled;
  final bool loading;
  final VoidCallback? onGenerate;
  final String? error;

  @override
  Widget build(BuildContext context) {
    if (!enabled) {
      return const PreviewOnlyBanner(
        message: 'AI thumbnail generation requires backend API.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        OutlinedButton.icon(
          key: const Key('generateThumbnailButton'),
          onPressed: loading ? null : onGenerate,
          icon: loading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.image_outlined),
          label: Text(
            loading ? 'Generating thumbnail' : 'Generate safe thumbnail',
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 8),
          Text(error!, style: Theme.of(context).textTheme.bodySmall),
        ],
      ],
    );
  }
}

class _GeneratedThumbnailPreview extends StatelessWidget {
  const _GeneratedThumbnailPreview({required this.signedUrl});

  final String signedUrl;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PraxisChip(label: 'AI thumbnail ready', icon: Icons.check),
        const SizedBox(height: 10),
        ClipRRect(
          key: const Key('generatedThumbnailPreview'),
          borderRadius: BorderRadius.circular(8),
          child: AspectRatio(
            aspectRatio: 1,
            child: Image.network(
              signedUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                alignment: Alignment.center,
                child: const Icon(Icons.image_outlined),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
