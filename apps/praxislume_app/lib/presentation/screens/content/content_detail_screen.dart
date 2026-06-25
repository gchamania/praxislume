import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../state/praxis_providers.dart';
import '../../shared/content_helpers.dart';
import '../../shared/generated_visual_asset_preview.dart';

class ContentDetailScreen extends ConsumerStatefulWidget {
  const ContentDetailScreen({required this.itemId, super.key});

  final String itemId;

  @override
  ConsumerState<ContentDetailScreen> createState() =>
      _ContentDetailScreenState();
}

class _ContentDetailScreenState extends ConsumerState<ContentDetailScreen> {
  late final TextEditingController _caption;
  String? _captionItemId;
  bool _postPackageCopied = false;
  bool _visualAssetLoading = false;
  bool _stateLoadRequested = false;
  GeneratedVisualAsset? _visualAsset;
  String? _visualAssetError;
  String? _latestVisualAssetRequestKey;

  @override
  void initState() {
    super.initState();
    _caption = TextEditingController();
  }

  @override
  void dispose() {
    _caption.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    final item = _findContentItem(state.items, widget.itemId);
    if (item == null) {
      if (!_stateLoadRequested) {
        _stateLoadRequested = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          ref.read(praxisProvider.notifier).load();
        });
      }
      return const WorkspaceShell(
        title: 'Content',
        subtitle: 'Loading content package.',
        currentRoute: '/library',
        child: PraxisCard(
          child: Center(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
      );
    }
    if (_captionItemId != item.id) {
      _captionItemId = item.id;
      _caption.text = item.caption;
    }
    final generationClient = ref.watch(praxisGenerationClientProvider);
    final clinicId = state.clinic?.id;
    final canHydrateLatestAsset =
        generationClient != null && clinicId != null && clinicId.isNotEmpty;
    final hydrationClinicId = clinicId;
    final latestAssetRequestKey = canHydrateLatestAsset
        ? '$hydrationClinicId:${item.id}'
        : null;
    if (hydrationClinicId != null &&
        latestAssetRequestKey != null &&
        _latestVisualAssetRequestKey != latestAssetRequestKey) {
      _latestVisualAssetRequestKey = latestAssetRequestKey;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadLatestVisualAsset(
          clinicId: hydrationClinicId,
          contentItemId: item.id,
          requestKey: latestAssetRequestKey,
        );
      });
    }
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
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: _visualAsset == null
                        ? MedicalThumbnail(
                            title: item.title,
                            category: item.category,
                            index: item.dayOffset,
                            aspectRatio: 1,
                          )
                        : GeneratedVisualAssetPreview(asset: _visualAsset!),
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    PraxisChip(
                      label: categoryLabel(item.category),
                      color: contentCategoryTint(item.category),
                    ),
                    if (_visualAsset != null)
                      const PraxisChip(
                        label: 'Generated asset ready',
                        icon: Icons.check,
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(item.title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text('CTA: ${item.shortCta}'),
                const SizedBox(height: 8),
                Text(item.reelScript),
                const SizedBox(height: 18),
                const Divider(),
                const SizedBox(height: 12),
                Text(
                  'Branded asset',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  generationClient == null
                      ? 'Visual asset generation is unavailable in this build.'
                      : _visualAsset == null
                      ? 'Creates a safe background and applies clinic branding through deterministic PraxisLume layers.'
                      : 'This branded asset is ready for manual review and export.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  key: const Key('generateVisualAssetButton'),
                  onPressed:
                      generationClient == null ||
                          _visualAssetLoading ||
                          _visualAsset != null
                      ? null
                      : () => _generateVisualAsset(item),
                  icon: _visualAssetLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : _visualAsset != null
                      ? const Icon(Icons.check_circle_outline)
                      : const Icon(Icons.auto_awesome_outlined),
                  label: Text(
                    _visualAssetLoading
                        ? 'Generating asset'
                        : _visualAsset != null
                        ? 'Asset ready'
                        : 'Generate branded asset',
                  ),
                ),
                if (_visualAssetError != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    _visualAssetError!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
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

  Future<void> _generateVisualAsset(ContentItem item) async {
    final generationClient = ref.read(praxisGenerationClientProvider);
    if (generationClient == null) {
      return;
    }

    setState(() {
      _visualAssetLoading = true;
      _visualAssetError = null;
    });

    try {
      final asset = await generationClient.generateVisualAsset(
        state: ref.read(praxisProvider),
        item: item,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _visualAsset = asset;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Branded asset generated')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _visualAssetError = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _visualAssetLoading = false;
        });
      }
    }
  }

  Future<void> _loadLatestVisualAsset({
    required String clinicId,
    required String contentItemId,
    required String requestKey,
  }) async {
    final generationClient = ref.read(praxisGenerationClientProvider);
    if (generationClient == null) {
      return;
    }

    try {
      final asset = await generationClient.fetchLatestVisualAsset(
        clinicId: clinicId,
        contentItemId: contentItemId,
      );
      if (!mounted ||
          asset == null ||
          _visualAsset != null ||
          _latestVisualAssetRequestKey != requestKey) {
        return;
      }
      setState(() {
        _visualAsset = asset;
      });
    } catch (_) {
      // The asset is optional; generation remains the primary action.
    }
  }
}

ContentItem? _findContentItem(List<ContentItem> items, String itemId) {
  for (final item in items) {
    if (item.id == itemId) {
      return item;
    }
  }
  return null;
}
