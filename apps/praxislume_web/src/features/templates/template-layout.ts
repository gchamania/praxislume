export type TemplateAspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export type TemplateElementId = "background" | "headline" | "cta" | "logo" | "disclaimer";

export type TemplateElementLayout = {
  id: TemplateElementId;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked?: boolean;
  visible?: boolean;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  align?: "left" | "center" | "right";
  lineHeight?: number;
};

export type TemplateLayout = {
  templateId: string;
  aspectRatio: TemplateAspectRatio;
  canvas: {
    width: number;
    height: number;
  };
  safeMargin: number;
  elements: Record<TemplateElementId, TemplateElementLayout>;
  defaults: Record<TemplateElementId, TemplateElementLayout>;
};

export type SerializedTemplateLayout = {
  templateId: string;
  aspectRatio: TemplateAspectRatio;
  elements: Record<TemplateElementId, ElementOverride>;
};

export type LayoutHistory = {
  past: TemplateLayout[];
  current: TemplateLayout;
  future: TemplateLayout[];
};

type ElementOverride = Partial<
  Pick<
    TemplateElementLayout,
    "x" | "y" | "width" | "height" | "rotation" | "locked" | "visible" | "fontFamily" | "fontSize" | "fontWeight" | "align" | "lineHeight"
  >
>;

const aspectCanvas: Record<TemplateAspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

const elementLimits: Record<TemplateElementId, { minWidth: number; maxWidthRatio: number; minHeight: number; maxHeight: number }> = {
  background: { minWidth: 1080, maxWidthRatio: 1.6, minHeight: 1080, maxHeight: 3072 },
  headline: { minWidth: 360, maxWidthRatio: 0.85, minHeight: 96, maxHeight: 260 },
  cta: { minWidth: 240, maxWidthRatio: 0.72, minHeight: 64, maxHeight: 160 },
  logo: { minWidth: 96, maxWidthRatio: 0.22, minHeight: 96, maxHeight: 220 },
  disclaimer: { minWidth: 420, maxWidthRatio: 0.9, minHeight: 48, maxHeight: 110 },
};

export function createDefaultTemplateLayout(input: {
  templateId: string;
  aspectRatio: TemplateAspectRatio;
}): TemplateLayout {
  const canvas = aspectCanvas[input.aspectRatio];
  const safeMargin = Math.round(Math.min(canvas.width, canvas.height) * 0.067);
  const elements: Record<TemplateElementId, TemplateElementLayout> = {
    background: {
      id: "background",
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      rotation: 0,
      locked: false,
      visible: true,
    },
    logo: {
      id: "logo",
      x: safeMargin,
      y: safeMargin,
      width: 132,
      height: 132,
      rotation: 0,
      locked: false,
      visible: true,
    },
    headline: {
      id: "headline",
      x: safeMargin,
      y: Math.round(canvas.height * 0.2),
      width: Math.round(canvas.width * 0.7),
      height: 180,
      rotation: 0,
      locked: false,
      visible: true,
      fontFamily: "Inter",
      fontSize: 76,
      fontWeight: 800,
      align: "left",
      lineHeight: 1.05,
    },
    cta: {
      id: "cta",
      x: safeMargin,
      y: canvas.height - safeMargin - 112,
      width: Math.round(canvas.width * 0.48),
      height: 112,
      rotation: 0,
      locked: false,
      visible: true,
      fontFamily: "Inter",
      fontSize: 36,
      fontWeight: 800,
      align: "center",
      lineHeight: 1.1,
    },
    disclaimer: {
      id: "disclaimer",
      x: safeMargin,
      y: canvas.height - safeMargin - 44,
      width: canvas.width - safeMargin * 2,
      height: 44,
      rotation: 0,
      locked: false,
      visible: true,
      fontFamily: "Inter",
      fontSize: 24,
      fontWeight: 500,
      align: "left",
      lineHeight: 1.15,
    },
  };

  return {
    templateId: input.templateId,
    aspectRatio: input.aspectRatio,
    canvas,
    safeMargin,
    elements: cloneElements(elements),
    defaults: cloneElements(elements),
  };
}

export function applyElementOverride(
  layout: TemplateLayout,
  elementId: TemplateElementId,
  override: ElementOverride,
): TemplateLayout {
  const current = layout.elements[elementId];
  if (current.locked && hasGeometryOverride(override)) {
    return layout;
  }
  if (elementId === "background") {
    return applyBackgroundOverride(layout, override);
  }
  const limits = elementLimits[elementId];
  const maxWidth = Math.min(layout.canvas.width - layout.safeMargin * 2, Math.round(layout.canvas.width * limits.maxWidthRatio));
  const nextWidth = clamp(override.width ?? current.width, limits.minWidth, maxWidth);
  const nextHeight = clamp(override.height ?? current.height, limits.minHeight, limits.maxHeight);
  const maxX = layout.canvas.width - layout.safeMargin - nextWidth;
  const maxY = layout.canvas.height - layout.safeMargin - nextHeight;

  const next: TemplateElementLayout = {
    ...current,
    ...override,
    width: nextWidth,
    height: nextHeight,
    x: clamp(override.x ?? current.x, layout.safeMargin, Math.max(layout.safeMargin, maxX)),
    y: clamp(override.y ?? current.y, layout.safeMargin, Math.max(layout.safeMargin, maxY)),
    rotation: clamp(override.rotation ?? current.rotation, -8, 8),
    locked: override.locked ?? current.locked,
    visible: override.visible ?? current.visible,
    fontFamily: override.fontFamily ?? current.fontFamily,
    fontSize: clamp(override.fontSize ?? current.fontSize ?? 24, 18, 96),
    fontWeight: clamp(override.fontWeight ?? current.fontWeight ?? 600, 400, 900),
    align: override.align ?? current.align,
    lineHeight: clamp(override.lineHeight ?? current.lineHeight ?? 1.1, 0.9, 1.5),
  };

  return {
    ...layout,
    elements: {
      ...layout.elements,
      [elementId]: next,
    },
  };
}

export function resetElementOverride(layout: TemplateLayout, elementId: TemplateElementId): TemplateLayout {
  return {
    ...layout,
    elements: {
      ...layout.elements,
      [elementId]: { ...layout.defaults[elementId] },
    },
  };
}

export function serializeTemplateLayout(layout: TemplateLayout): string {
  const elements = Object.fromEntries(
    Object.entries(layout.elements).map(([id, element]) => [
      id,
      {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        locked: element.locked,
        visible: element.visible,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        align: element.align,
        lineHeight: element.lineHeight,
      },
    ]),
  ) as Record<TemplateElementId, ElementOverride>;

  return JSON.stringify({
    templateId: layout.templateId,
    aspectRatio: layout.aspectRatio,
    elements,
  } satisfies SerializedTemplateLayout);
}

export function hydrateTemplateLayout(base: TemplateLayout, serialized: string | null | undefined): TemplateLayout {
  if (!serialized) return base;
  try {
    const parsed = JSON.parse(serialized) as Partial<SerializedTemplateLayout>;
    if (parsed.templateId !== base.templateId || parsed.aspectRatio !== base.aspectRatio || !parsed.elements) {
      return base;
    }
    return (Object.entries(parsed.elements) as Array<[TemplateElementId, ElementOverride]>).reduce(
      (layout, [elementId, override]) => (isTemplateElementId(elementId) ? applyElementOverride(layout, elementId, override) : layout),
      base,
    );
  } catch {
    return base;
  }
}

export function createLayoutHistory(initial: TemplateLayout): LayoutHistory {
  return { past: [], current: initial, future: [] };
}

export function pushLayoutHistory(history: LayoutHistory, next: TemplateLayout): LayoutHistory {
  return {
    past: [...history.past.slice(-12), history.current],
    current: next,
    future: [],
  };
}

export function undoLayoutHistory(history: LayoutHistory): LayoutHistory {
  const previous = history.past[history.past.length - 1];
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    current: previous,
    future: [history.current, ...history.future].slice(0, 13),
  };
}

export function redoLayoutHistory(history: LayoutHistory): LayoutHistory {
  const next = history.future[0];
  if (!next) return history;
  return {
    past: [...history.past.slice(-12), history.current],
    current: next,
    future: history.future.slice(1),
  };
}

export function isLayoutSafe(layout: TemplateLayout): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const [id, element] of Object.entries(layout.elements) as Array<[TemplateElementId, TemplateElementLayout]>) {
    if (id === "background") {
      continue;
    }
    if (element.x < layout.safeMargin || element.y < layout.safeMargin) {
      violations.push(`${id} starts outside safe margin`);
    }
    if (element.x + element.width > layout.canvas.width - layout.safeMargin) {
      violations.push(`${id} exceeds right safe margin`);
    }
    if (element.y + element.height > layout.canvas.height - layout.safeMargin) {
      violations.push(`${id} exceeds bottom safe margin`);
    }
  }
  return { ok: violations.length === 0, violations };
}

function cloneElements(elements: Record<TemplateElementId, TemplateElementLayout>) {
  return Object.fromEntries(
    Object.entries(elements).map(([key, value]) => [key, { ...value }]),
  ) as Record<TemplateElementId, TemplateElementLayout>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function applyBackgroundOverride(layout: TemplateLayout, override: ElementOverride): TemplateLayout {
  const current = layout.elements.background;
  const nextWidth = clamp(override.width ?? current.width, layout.canvas.width, Math.round(layout.canvas.width * 1.6));
  const nextHeight = clamp(override.height ?? current.height, layout.canvas.height, Math.round(layout.canvas.height * 1.6));
  const minX = layout.canvas.width - nextWidth;
  const minY = layout.canvas.height - nextHeight;
  const next: TemplateElementLayout = {
    ...current,
    ...override,
    width: nextWidth,
    height: nextHeight,
    x: clamp(override.x ?? current.x, Math.min(0, minX), 0),
    y: clamp(override.y ?? current.y, Math.min(0, minY), 0),
    rotation: 0,
    locked: override.locked ?? current.locked,
    visible: override.visible ?? current.visible,
  };

  return {
    ...layout,
    elements: {
      ...layout.elements,
      background: next,
    },
  };
}

function hasGeometryOverride(override: ElementOverride) {
  return override.x !== undefined || override.y !== undefined || override.width !== undefined || override.height !== undefined || override.rotation !== undefined;
}

function isTemplateElementId(value: string): value is TemplateElementId {
  return value === "background" || value === "headline" || value === "cta" || value === "logo" || value === "disclaimer";
}
