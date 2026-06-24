import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
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
              children: [
                editor,
                const SizedBox(height: 16),
                preview,
                const SizedBox(height: 16),
                _CarouselStudioPanel(item: item),
              ],
            );
          }
          return Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: preview),
                  const SizedBox(width: 16),
                  Expanded(flex: 2, child: editor),
                ],
              ),
              const SizedBox(height: 16),
              _CarouselStudioPanel(item: item),
            ],
          );
        },
      ),
    );
  }
}

class _CarouselStudioPanel extends ConsumerStatefulWidget {
  const _CarouselStudioPanel({required this.item});

  final ContentItem item;

  @override
  ConsumerState<_CarouselStudioPanel> createState() =>
      _CarouselStudioPanelState();
}

class _CarouselStudioPanelState extends ConsumerState<_CarouselStudioPanel> {
  var _loading = false;
  var _copied = false;
  var _saved = false;
  late List<CarouselSlide> _drafts;

  @override
  void initState() {
    super.initState();
    _drafts = widget.item.carouselSlides;
  }

  @override
  void didUpdateWidget(covariant _CarouselStudioPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_signature(oldWidget.item.carouselSlides) !=
        _signature(widget.item.carouselSlides)) {
      _drafts = widget.item.carouselSlides;
    }
  }

  @override
  Widget build(BuildContext context) {
    final slides = _drafts;
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 10,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const PraxisChip(
                label: 'Carousel Studio v0.3',
                icon: Icons.view_carousel_outlined,
              ),
              PraxisChip(
                label: slides.isEmpty
                    ? 'Structured template'
                    : '${slides.length} slides ready',
                color: slides.isEmpty ? praxisMint : const Color(0xFFE9F8EF),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Turn this topic into a branded patient-education carousel with editable slide copy, CTA, and disclaimer.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          if (slides.isEmpty)
            Wrap(
              spacing: 10,
              runSpacing: 10,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                FilledButton.icon(
                  key: const Key('generateCarouselButton'),
                  onPressed: _loading ? null : _generate,
                  icon: _loading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.auto_awesome),
                  label: Text(
                    _loading
                        ? 'Generating carousel'
                        : 'Generate 5-slide carousel',
                  ),
                ),
                const PreviewOnlyBanner(
                  message:
                      'No freeform canvas: v0.3 uses deterministic branded layouts.',
                ),
              ],
            )
          else ...[
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final slide in slides)
                  SizedBox(
                    width: 220,
                    child: _CarouselSlidePreview(
                      slide: slide,
                      brandColor: parseBrandColor(
                        ref.watch(praxisProvider).brandKit.primaryColor,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.icon(
                  onPressed: _save,
                  icon: const Icon(Icons.save_outlined),
                  label: const Text('Save carousel text'),
                ),
                OutlinedButton.icon(
                  key: const Key('copyCarouselPackageButton'),
                  onPressed: _copyPackage,
                  icon: const Icon(Icons.copy_all_outlined),
                  label: const Text('Copy carousel package'),
                ),
                OutlinedButton.icon(
                  onPressed: _loading ? null : _generate,
                  icon: const Icon(Icons.refresh_outlined),
                  label: const Text('Regenerate'),
                ),
              ],
            ),
            const SizedBox(height: 18),
            LayoutBuilder(
              builder: (context, constraints) {
                final twoColumns = constraints.maxWidth > 920;
                final fields = [
                  for (var i = 0; i < slides.length; i++)
                    _CarouselSlideEditor(
                      slide: slides[i],
                      onChanged: (slide) {
                        setState(() {
                          _drafts = [
                            for (final draft in _drafts)
                              if (draft.slideNumber == slide.slideNumber)
                                slide
                              else
                                draft,
                          ];
                          _saved = false;
                        });
                      },
                    ),
                ];
                if (!twoColumns) {
                  return Column(
                    children: [
                      for (final field in fields)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: field,
                        ),
                    ],
                  );
                }
                return Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    for (final field in fields)
                      SizedBox(
                        width: (constraints.maxWidth - 12) / 2,
                        child: field,
                      ),
                  ],
                );
              },
            ),
            if (_saved || _copied) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (_saved)
                    const PraxisChip(
                      label: 'Carousel saved',
                      icon: Icons.check,
                    ),
                  if (_copied)
                    const PraxisChip(
                      label: 'Carousel package copied',
                      icon: Icons.check,
                    ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Future<void> _generate() async {
    setState(() {
      _loading = true;
      _copied = false;
      _saved = false;
    });
    try {
      final slides = await ref
          .read(praxisProvider.notifier)
          .generateCarouselForItem(widget.item.id);
      setState(() => _drafts = slides);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Carousel slides ready')));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _save() async {
    await ref
        .read(praxisProvider.notifier)
        .saveCarouselSlidesForItem(itemId: widget.item.id, slides: _drafts);
    setState(() => _saved = true);
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Carousel text saved')));
  }

  void _copyPackage() {
    Clipboard.setData(ClipboardData(text: _carouselPackageText(_drafts)));
    setState(() => _copied = true);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Carousel package copied')));
  }

  String _signature(List<CarouselSlide> slides) {
    return slides
        .map((slide) => '${slide.slideNumber}:${slide.headline}:${slide.body}')
        .join('|');
  }
}

class _CarouselSlidePreview extends StatelessWidget {
  const _CarouselSlidePreview({required this.slide, required this.brandColor});

  final CarouselSlide slide;
  final Color brandColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: Key('carouselSlidePreview-${slide.slideNumber}'),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: slide.role == 'cover' ? brandColor : praxisSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: praxisLine),
      ),
      child: AspectRatio(
        aspectRatio: 4 / 5,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Slide ${slide.slideNumber} / ${slide.role}',
              style: TextStyle(
                color: slide.role == 'cover' ? Colors.white70 : praxisMuted,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const Spacer(),
            Text(
              slide.headline,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: slide.role == 'cover' ? Colors.white : praxisText,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              slide.body,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: slide.role == 'cover' ? Colors.white70 : praxisMuted,
              ),
            ),
            const Spacer(),
            Text(
              slide.visualCue,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: slide.role == 'cover' ? Colors.white70 : praxisTealDark,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CarouselSlideEditor extends StatelessWidget {
  const _CarouselSlideEditor({required this.slide, required this.onChanged});

  final CarouselSlide slide;
  final ValueChanged<CarouselSlide> onChanged;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      padding: const EdgeInsets.all(12),
      color: praxisSurface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Slide ${slide.slideNumber}: ${slide.role}',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 10),
          TextFormField(
            initialValue: slide.headline,
            decoration: const InputDecoration(labelText: 'Headline'),
            onChanged: (value) => onChanged(slide.copyWith(headline: value)),
          ),
          const SizedBox(height: 10),
          TextFormField(
            initialValue: slide.body,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Body'),
            onChanged: (value) => onChanged(slide.copyWith(body: value)),
          ),
          const SizedBox(height: 10),
          TextFormField(
            initialValue: slide.visualCue,
            decoration: const InputDecoration(labelText: 'Visual cue'),
            onChanged: (value) => onChanged(slide.copyWith(visualCue: value)),
          ),
        ],
      ),
    );
  }
}

String _carouselPackageText(List<CarouselSlide> slides) {
  return slides
      .map(
        (slide) =>
            'Slide ${slide.slideNumber} (${slide.role})\n${slide.headline}\n${slide.body}\nVisual cue: ${slide.visualCue}',
      )
      .join('\n\n');
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
