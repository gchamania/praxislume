import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/entities/praxis_models.dart';
import '../../../ui/praxis_components.dart';
import '../../../ui/praxis_theme.dart';
import '../../shared/content_helpers.dart';
import '../../state/praxis_providers.dart';
import '../calendar/calendar_screen.dart';

class ContentLibraryScreen extends ConsumerStatefulWidget {
  const ContentLibraryScreen({super.key});

  @override
  ConsumerState<ContentLibraryScreen> createState() =>
      _ContentLibraryScreenState();
}

class _ContentLibraryScreenState extends ConsumerState<ContentLibraryScreen> {
  final _search = TextEditingController();
  String _status = 'All';
  String _category = 'All categories';
  String _sort = 'Campaign order';
  bool _grid = true;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(praxisProvider);
    final items = _filteredItems(state.items);
    return WorkspaceShell(
      title: 'Content Library',
      subtitle: 'All your content in one place.',
      currentRoute: '/library',
      primaryAction: FilledButton.icon(
        onPressed: () => context.go('/generate'),
        icon: const Icon(Icons.add),
        label: const Text('Generate New Content'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _LibraryToolbar(
            search: _search,
            status: _status,
            category: _category,
            sort: _sort,
            grid: _grid,
            onChanged: () => setState(() {}),
            onStatus: (value) => setState(() => _status = value),
            onCategory: (value) => setState(() => _category = value),
            onSort: (value) => setState(() => _sort = value),
            onGrid: (value) => setState(() => _grid = value),
            total: state.items.length,
            filtered: items.length,
          ),
          const SizedBox(height: 18),
          if (state.items.isEmpty)
            const EmptyCampaignPanel()
          else if (items.isEmpty)
            const PraxisCard(
              child: Text('No content matches the current search or filters.'),
            )
          else if (_grid)
            _ContentGrid(items: items)
          else
            _ContentList(items: items),
        ],
      ),
    );
  }

  List<ContentItem> _filteredItems(List<ContentItem> source) {
    final query = _search.text.trim().toLowerCase();
    final filtered = source.where((item) {
      final queryMatches =
          query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          item.caption.toLowerCase().contains(query) ||
          item.category.toLowerCase().contains(query);
      final statusMatches =
          _status == 'All' ||
          item.status.toLowerCase() == _status.toLowerCase();
      final categoryMatches =
          _category == 'All categories' ||
          categoryLabel(item.category) == _category;
      return queryMatches && statusMatches && categoryMatches;
    }).toList();
    if (_sort == 'Newest first') {
      return filtered.reversed.toList();
    }
    if (_sort == 'Category') {
      filtered.sort(
        (a, b) =>
            categoryLabel(a.category).compareTo(categoryLabel(b.category)),
      );
    }
    return filtered;
  }
}

class _LibraryToolbar extends StatelessWidget {
  const _LibraryToolbar({
    required this.search,
    required this.status,
    required this.category,
    required this.sort,
    required this.grid,
    required this.onChanged,
    required this.onStatus,
    required this.onCategory,
    required this.onSort,
    required this.onGrid,
    required this.total,
    required this.filtered,
  });

  final TextEditingController search;
  final String status;
  final String category;
  final String sort;
  final bool grid;
  final VoidCallback onChanged;
  final ValueChanged<String> onStatus;
  final ValueChanged<String> onCategory;
  final ValueChanged<String> onSort;
  final ValueChanged<bool> onGrid;
  final int total;
  final int filtered;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PrototypeSectionHeader(
            title: 'Library controls',
            subtitle: '$filtered of $total content items visible',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                FilterPill(
                  label: 'Grid',
                  active: grid,
                  icon: Icons.grid_view_outlined,
                  onTap: () => onGrid(true),
                ),
                const SizedBox(width: 8),
                FilterPill(
                  label: 'List',
                  active: !grid,
                  icon: Icons.view_list_outlined,
                  onTap: () => onGrid(false),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            key: const Key('librarySearchField'),
            controller: search,
            onChanged: (_) => onChanged(),
            decoration: const InputDecoration(
              labelText: 'Search content',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final value in const [
                'All',
                'idea',
                'drafted',
                'designed',
                'posted',
              ])
                FilterPill(
                  label: value,
                  active: status == value,
                  icon: Icons.check_circle_outline,
                  onTap: () => onStatus(value),
                ),
              for (final value in const [
                'All categories',
                'Awareness',
                'Myth-buster',
                'Symptoms',
                'Explainer',
                'Tip',
                'Service',
                'FAQ',
              ])
                FilterPill(
                  label: value,
                  active: category == value,
                  icon: Icons.category_outlined,
                  onTap: () => onCategory(value),
                ),
              for (final value in const [
                'Campaign order',
                'Newest first',
                'Category',
              ])
                FilterPill(
                  label: value,
                  active: sort == value,
                  icon: Icons.sort,
                  onTap: () => onSort(value),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ContentGrid extends StatelessWidget {
  const _ContentGrid({required this.items});

  final List<ContentItem> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final columns = width >= 1180
            ? 4
            : width >= 860
            ? 3
            : width >= 560
            ? 2
            : 1;
        final cardWidth = (width - ((columns - 1) * 16)) / columns;
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            for (var i = 0; i < items.length; i++)
              SizedBox(
                width: cardWidth,
                child: ContentLibraryCard(item: items[i], index: i),
              ),
          ],
        );
      },
    );
  }
}

class _ContentList extends StatelessWidget {
  const _ContentList({required this.items});

  final List<ContentItem> items;

  @override
  Widget build(BuildContext context) {
    return PraxisCard(
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++)
            Padding(
              padding: EdgeInsets.only(bottom: i == items.length - 1 ? 0 : 14),
              child: ContentMiniCard(item: items[i], index: i),
            ),
        ],
      ),
    );
  }
}

class ContentLibraryCard extends StatelessWidget {
  const ContentLibraryCard({
    required this.item,
    required this.index,
    super.key,
  });

  final ContentItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go('/content/${item.id}'),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          color: praxisSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: praxisLine),
          boxShadow: [
            BoxShadow(
              color: praxisInk.withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MedicalThumbnail(
              title: item.title,
              category: item.category,
              index: index,
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      StatusBadge(
                        label: categoryLabel(item.category),
                        color: contentCategoryTint(item.category),
                      ),
                      StatusBadge(label: item.status),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 16,
                        color: praxisMuted,
                      ),
                      const SizedBox(width: 6),
                      Text('Day ${item.dayOffset + 1}'),
                      const Spacer(),
                      const Icon(
                        Icons.copy_outlined,
                        size: 16,
                        color: praxisMuted,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ContentMiniCard extends StatelessWidget {
  const ContentMiniCard({required this.item, required this.index, super.key});

  final ContentItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go('/content/${item.id}'),
      borderRadius: BorderRadius.circular(8),
      child: Row(
        children: [
          SizedBox(
            width: 110,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: MedicalThumbnail(
                title: item.title,
                category: item.category,
                index: index,
                aspectRatio: 1.35,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  item.caption,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    StatusBadge(
                      label: categoryLabel(item.category),
                      color: contentCategoryTint(item.category),
                    ),
                    StatusBadge(label: item.status),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
