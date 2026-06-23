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
