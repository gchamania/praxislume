// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

import '../../domain/entities/praxis_models.dart';
import 'generated_visual_asset_preview_io.dart';

class GeneratedVisualAssetPreview extends StatefulWidget {
  const GeneratedVisualAssetPreview({required this.asset, super.key});

  final GeneratedVisualAsset asset;

  @override
  State<GeneratedVisualAssetPreview> createState() =>
      _GeneratedVisualAssetPreviewState();
}

class _GeneratedVisualAssetPreviewState
    extends State<GeneratedVisualAssetPreview> {
  static int _nextViewId = 0;

  late String _viewType;

  @override
  void initState() {
    super.initState();
    _registerViewFactory();
  }

  @override
  void didUpdateWidget(covariant GeneratedVisualAssetPreview oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.asset.signedUrl != widget.asset.signedUrl) {
      _registerViewFactory();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.asset.mimeType != 'image/svg+xml') {
      return Image.network(
        widget.asset.signedUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) =>
            const GeneratedAssetPreviewError(),
      );
    }

    return HtmlElementView(viewType: _viewType);
  }

  void _registerViewFactory() {
    final signedUrl = widget.asset.signedUrl;
    _viewType = 'praxis-generated-asset-${_nextViewId++}';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (viewId) {
      final container = html.DivElement()
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.overflow = 'hidden';
      final image = html.ImageElement(src: signedUrl)
        ..alt = 'Generated branded asset'
        ..style.width = '100%'
        ..style.height = '100%';
      image.style.setProperty('object-fit', 'cover');
      image.style.setProperty('display', 'block');
      container.children.add(image);
      return container;
    });
  }
}
