"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Download, Eye, EyeOff, Lock, Move, Redo2, RotateCcw, Save, Type, Undo2, Unlock } from "lucide-react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import { Button, Badge } from "@/components/ui";
import { finalAdjustCapabilities } from "@/features/staff/mobile-staff-ux";
import {
  applyElementOverride,
  createLayoutHistory,
  createDefaultTemplateLayout,
  hydrateTemplateLayout,
  isLayoutSafe,
  pushLayoutHistory,
  redoLayoutHistory,
  resetElementOverride,
  serializeTemplateLayout,
  undoLayoutHistory,
  type LayoutHistory,
  type TemplateAspectRatio,
  type TemplateElementId,
  type TemplateLayout,
} from "@/features/templates/template-layout";

const aspectRatios: TemplateAspectRatio[] = ["1:1", "4:5", "9:16", "16:9"];
const editableElements: TemplateElementId[] = ["headline", "cta", "logo", "disclaimer", "background"];

export function KonvaFinalAdjuster({
  storageKey,
  clinicName,
  headline,
  cta,
  disclaimer,
  backgroundUrl,
  visualLabel,
}: {
  storageKey: string;
  clinicName: string;
  headline: string;
  cta: string;
  disclaimer: string;
  backgroundUrl?: string;
  visualLabel?: string;
}) {
  const [history, setHistory] = useState<LayoutHistory>(() =>
    createLayoutHistory(createInitialLayout(storageKey)),
  );
  const layout = history.current;
  const aspectRatio = layout.aspectRatio;
  const [selected, setSelected] = useState<TemplateElementId>("headline");
  const [saved, setSaved] = useState(false);
  const stageRef = useRef<{ toDataURL: (input?: { pixelRatio?: number }) => string } | null>(null);
  const scale = useMemo(() => Math.min(1, 640 / layout.canvas.width, 720 / layout.canvas.height), [layout.canvas.height, layout.canvas.width]);
  const safety = isLayoutSafe(layout);
  const mobileCapabilities = finalAdjustCapabilities("mobile");
  const desktopCapabilities = finalAdjustCapabilities("desktop");
  const backgroundImage = useKonvaImage(backgroundUrl);
  const selectedElement = layout.elements[selected];
  const textElementSelected = selected === "headline" || selected === "cta" || selected === "disclaimer";

  function push(next: TemplateLayout) {
    setHistory((current) => pushLayoutHistory(current, next));
    setSaved(false);
  }

  function switchAspect(nextAspect: TemplateAspectRatio) {
    setHistory(createLayoutHistory(createDefaultTemplateLayout({ templateId: layout.templateId, aspectRatio: nextAspect })));
    setSaved(false);
  }

  function updateElement(elementId: TemplateElementId, patch: { x?: number; y?: number; width?: number; height?: number }) {
    push(applyElementOverride(layout, elementId, patch));
  }

  function updateElementSettings(elementId: TemplateElementId, patch: Parameters<typeof applyElementOverride>[2]) {
    push(applyElementOverride(layout, elementId, patch));
  }

  function nudgeSelected(dx: number, dy: number) {
    updateElement(selected, {
      x: layout.elements[selected].x + dx,
      y: layout.elements[selected].y + dy,
    });
  }

  function undo() {
    setHistory((current) => undoLayoutHistory(current));
    setSaved(false);
  }

  function redo() {
    setHistory((current) => redoLayoutHistory(current));
    setSaved(false);
  }

  function saveLayout() {
    window.localStorage.setItem(storageKey, serializeTemplateLayout(layout));
    setSaved(true);
  }

  function exportPreview() {
    const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });
    if (!dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `praxislume-final-adjust-${aspectRatio.replace(":", "x")}.png`;
    anchor.click();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 lg:hidden">
          <Badge tone="indigo">preview-first</Badge>
          <p className="text-xs font-bold text-slate-500">
            {mobileCapabilities.primaryControls.map((control) => control.replace("_", " ")).join(" / ")}
          </p>
        </div>
        <div className="mx-auto w-fit rounded-2xl bg-slate-100 p-4">
          <Stage
            ref={stageRef as never}
            width={layout.canvas.width * scale}
            height={layout.canvas.height * scale}
            scaleX={scale}
            scaleY={scale}
          >
            <Layer>
              <Rect width={layout.canvas.width} height={layout.canvas.height} fill="#f8f9ff" />
              {layout.elements.background.visible === false ? null : backgroundImage ? (
                <KonvaImage
                  {...layout.elements.background}
                  image={backgroundImage}
                  draggable={!layout.elements.background.locked}
                  onClick={() => setSelected("background")}
                  onTap={() => setSelected("background")}
                  onDragEnd={(event) => updateElement("background", { x: event.target.x(), y: event.target.y() })}
                />
              ) : (
                <Rect
                  {...layout.elements.background}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: layout.canvas.width, y: layout.canvas.height }}
                  fillLinearGradientColorStops={[0, "#dff8f3", 0.54, "#ffffff", 1, "#e7e5ff"]}
                  draggable={!layout.elements.background.locked}
                  onClick={() => setSelected("background")}
                  onTap={() => setSelected("background")}
                  onDragEnd={(event) => updateElement("background", { x: event.target.x(), y: event.target.y() })}
                />
              )}
              <Line
                points={[
                  layout.safeMargin,
                  layout.safeMargin,
                  layout.canvas.width - layout.safeMargin,
                  layout.safeMargin,
                  layout.canvas.width - layout.safeMargin,
                  layout.canvas.height - layout.safeMargin,
                  layout.safeMargin,
                  layout.canvas.height - layout.safeMargin,
                  layout.safeMargin,
                  layout.safeMargin,
                ]}
                stroke="#6366f1"
                dash={[16, 12]}
                opacity={0.5}
              />
              {layout.elements.logo.visible === false ? null : <ElementBox
                id="logo"
                selected={selected === "logo"}
                layout={layout}
                onSelect={setSelected}
                onMove={updateElement}
                onResize={updateElement}
              >
                <Rect width={layout.elements.logo.width} height={layout.elements.logo.height} cornerRadius={28} fill="#0D4D57" />
                <Text text={clinicName.slice(0, 1)} fill="#ffffff" fontStyle="bold" fontSize={72} width={layout.elements.logo.width} height={layout.elements.logo.height} align="center" verticalAlign="middle" />
              </ElementBox>}
              {layout.elements.headline.visible === false ? null : <ElementBox
                id="headline"
                selected={selected === "headline"}
                layout={layout}
                onSelect={setSelected}
                onMove={updateElement}
                onResize={updateElement}
              >
                <Text
                  text={headline}
                  fill="#121c2a"
                  fontFamily={layout.elements.headline.fontFamily}
                  fontStyle={layout.elements.headline.fontWeight && layout.elements.headline.fontWeight >= 700 ? "bold" : "normal"}
                  fontSize={layout.elements.headline.fontSize}
                  width={layout.elements.headline.width}
                  height={layout.elements.headline.height}
                  align={layout.elements.headline.align}
                  lineHeight={layout.elements.headline.lineHeight}
                />
              </ElementBox>}
              {layout.elements.cta.visible === false ? null : <ElementBox id="cta" selected={selected === "cta"} layout={layout} onSelect={setSelected} onMove={updateElement} onResize={updateElement}>
                <Rect width={layout.elements.cta.width} height={layout.elements.cta.height} cornerRadius={32} fill="#5017e9" />
                <Text
                  text={cta}
                  fill="#ffffff"
                  fontFamily={layout.elements.cta.fontFamily}
                  fontStyle={layout.elements.cta.fontWeight && layout.elements.cta.fontWeight >= 700 ? "bold" : "normal"}
                  fontSize={layout.elements.cta.fontSize}
                  width={layout.elements.cta.width}
                  height={layout.elements.cta.height}
                  align={layout.elements.cta.align}
                  verticalAlign="middle"
                  lineHeight={layout.elements.cta.lineHeight}
                />
              </ElementBox>}
              {layout.elements.disclaimer.visible === false ? null : <ElementBox
                id="disclaimer"
                selected={selected === "disclaimer"}
                layout={layout}
                onSelect={setSelected}
                onMove={updateElement}
                onResize={updateElement}
              >
                <Text
                  text={disclaimer}
                  fill="#475569"
                  fontFamily={layout.elements.disclaimer.fontFamily}
                  fontSize={layout.elements.disclaimer.fontSize}
                  fontStyle={layout.elements.disclaimer.fontWeight && layout.elements.disclaimer.fontWeight >= 700 ? "bold" : "normal"}
                  width={layout.elements.disclaimer.width}
                  height={layout.elements.disclaimer.height}
                  align={layout.elements.disclaimer.align}
                  lineHeight={layout.elements.disclaimer.lineHeight}
                />
              </ElementBox>}
            </Layer>
          </Stage>
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-500">Final Adjust</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Controlled Konva editor</h2>
          </div>
          <Badge tone={safety.ok ? "emerald" : "orange"}>{safety.ok ? "Safe" : "Check"}</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Move or resize only approved template zones. Medical text remains structured and provider calls stay backend-only.
        </p>
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
          Background: {visualLabel ?? "Template background"}
        </div>

        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 lg:hidden">
          <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-950">
            <Move className="h-4 w-4" /> Mobile quick adjust
          </div>
          <p className="mt-2 text-xs leading-relaxed text-indigo-700">
            Staff view keeps final adjustment to movement, reset, aspect ratio, and save.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
            <Button variant="secondary" onClick={() => nudgeSelected(0, -16)}>Up</Button>
            <Button variant="secondary" onClick={() => nudgeSelected(-16, 0)}>Left</Button>
            <Button variant="secondary" onClick={() => nudgeSelected(16, 0)}>Right</Button>
            <Button variant="secondary" onClick={() => nudgeSelected(0, 16)}>Down</Button>
            <Button variant="secondary" onClick={() => push(resetElementOverride(layout, selected))}>Reset</Button>
            <Button onClick={saveLayout}>{saved ? "Saved" : "Save"}</Button>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Aspect ratio</p>
          <div className="grid grid-cols-4 gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                className={`rounded-lg border px-2 py-2 text-xs font-extrabold ${ratio === aspectRatio ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
                onClick={() => switchAspect(ratio)}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Editable zone</p>
          <div className="grid gap-2">
            {editableElements.map((element) => (
              <div
                key={element}
                className={`grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-lg border px-3 py-2 ${selected === element ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
              >
                <button className="min-w-0 text-left text-xs font-extrabold capitalize" onClick={() => setSelected(element)}>
                  <span className="block truncate">{element.replace("_", " ")}</span>
                </button>
                <button aria-label={`Toggle ${element} visibility`} onClick={() => updateElementSettings(element, { visible: layout.elements[element].visible === false })}>
                  {layout.elements[element].visible === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button aria-label={`Toggle ${element} lock`} onClick={() => updateElementSettings(element, { locked: !layout.elements[element].locked })}>
                  {layout.elements[element].locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
                <button aria-label={`Reset ${element}`} onClick={() => push(resetElementOverride(layout, element))}>
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {textElementSelected ? (
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              <Type className="h-4 w-4" /> Text style
            </p>
            <div className="grid gap-3">
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                value={selectedElement.fontFamily ?? "Inter"}
                onChange={(event) => updateElementSettings(selected, { fontFamily: event.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
              </select>
              <label className="text-xs font-bold text-slate-500">
                Size {selectedElement.fontSize ?? 24}px
                <input
                  className="mt-2 w-full accent-indigo-600"
                  type="range"
                  min="18"
                  max="96"
                  value={selectedElement.fontSize ?? 24}
                  onChange={(event) => updateElementSettings(selected, { fontSize: Number(event.target.value) })}
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    className={`rounded-lg border px-2 py-2 text-xs font-extrabold capitalize ${selectedElement.align === align ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
                    onClick={() => updateElementSettings(selected, { align })}
                  >
                    {align}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[500, 700, 800, 900].map((weight) => (
                  <button
                    key={weight}
                    className={`rounded-lg border px-2 py-2 text-xs font-extrabold ${selectedElement.fontWeight === weight ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
                    onClick={() => updateElementSettings(selected, { fontWeight: weight })}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 hidden grid-cols-2 gap-2 lg:grid">
          <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
            Desktop controls: {desktopCapabilities.primaryControls.map((control) => control.replace("_", " ")).join(" / ")}
          </div>
          <Button variant="secondary" onClick={() => updateElement(selected, { width: layout.elements[selected].width + 32 })}>Wider</Button>
          <Button variant="secondary" onClick={() => updateElement(selected, { width: layout.elements[selected].width - 32 })}>Narrower</Button>
          <Button variant="secondary" onClick={() => updateElement(selected, { height: layout.elements[selected].height + 20 })}>Taller</Button>
          <Button variant="secondary" onClick={() => updateElement(selected, { height: layout.elements[selected].height - 20 })}>Shorter</Button>
          {selected === "background" ? (
            <>
              <Button variant="secondary" onClick={() => updateElement("background", { width: layout.elements.background.width + 72, height: layout.elements.background.height + 72 })}>Zoom in</Button>
              <Button variant="secondary" onClick={() => updateElement("background", { width: layout.elements.background.width - 72, height: layout.elements.background.height - 72 })}>Zoom out</Button>
            </>
          ) : null}
          <Button variant="secondary" onClick={() => nudgeSelected(-16, 0)}>Nudge left</Button>
          <Button variant="secondary" onClick={() => nudgeSelected(16, 0)}>Nudge right</Button>
          <Button variant="secondary" onClick={() => nudgeSelected(0, -16)}>Nudge up</Button>
          <Button variant="secondary" onClick={() => nudgeSelected(0, 16)}>Nudge down</Button>
        </div>

        <div className="mt-6 hidden gap-2 lg:grid">
          <Button variant="secondary" onClick={undo} disabled={history.past.length === 0}>
            <Undo2 className="h-4 w-4" /> Undo
          </Button>
          <Button variant="secondary" onClick={redo} disabled={history.future.length === 0}>
            <Redo2 className="h-4 w-4" /> Redo
          </Button>
          <Button variant="secondary" onClick={() => push(resetElementOverride(layout, selected))}>
            <RotateCcw className="h-4 w-4" /> Reset selected
          </Button>
          <Button onClick={saveLayout}>
            <Save className="h-4 w-4" /> {saved ? "Layout saved" : "Save layout"}
          </Button>
          <Button variant="teal" onClick={exportPreview}>
            <Download className="h-4 w-4" /> Export preview PNG
          </Button>
        </div>
      </aside>
    </div>
  );
}

function ElementBox({
  id,
  selected,
  layout,
  onSelect,
  onMove,
  onResize,
  children,
}: {
  id: TemplateElementId;
  selected: boolean;
  layout: TemplateLayout;
  onSelect(id: TemplateElementId): void;
  onMove(id: TemplateElementId, patch: { x?: number; y?: number }): void;
  onResize(id: TemplateElementId, patch: { width?: number; height?: number }): void;
  children: ReactNode;
}) {
  const element = layout.elements[id];
  return (
    <Group
      x={element.x}
      y={element.y}
      draggable={!element.locked}
      onClick={() => onSelect(id)}
      onTap={() => onSelect(id)}
      onDragEnd={(event) => onMove(id, { x: event.target.x(), y: event.target.y() })}
    >
      {children}
      <Rect
        width={element.width}
        height={element.height}
        stroke={selected ? "#5017e9" : "transparent"}
        strokeWidth={selected ? 5 : 0}
        dash={[12, 8]}
        listening={false}
      />
      {selected && id !== "background" ? (
        <>
          <Rect
            x={element.width - 26}
            y={element.height - 26}
            width={34}
            height={34}
            cornerRadius={8}
            fill="#ffffff"
            stroke="#5017e9"
            strokeWidth={4}
            draggable
            onDragEnd={(event) => {
              onResize(id, {
                width: event.target.x() + 26,
                height: event.target.y() + 26,
              });
            }}
          />
          <Text
            x={element.width - 20}
            y={element.height - 20}
            text="SE"
            fontSize={18}
            fill="#5017e9"
            listening={false}
          />
        </>
      ) : null}
    </Group>
  );
}

function useKonvaImage(url: string | undefined) {
  const [loaded, setLoaded] = useState<{ url: string; image?: HTMLImageElement }>();
  useEffect(() => {
    if (!url) {
      return;
    }
    const nextImage = new window.Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.onload = () => setLoaded({ url, image: nextImage });
    nextImage.onerror = () => setLoaded({ url });
    nextImage.src = url;
    return () => {
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [url]);
  if (!loaded || loaded.url !== url) return undefined;
  return loaded.image;
}

function createInitialLayout(storageKey: string): TemplateLayout {
  const savedLayout = typeof window === "undefined" ? null : window.localStorage.getItem(storageKey);
  const savedAspect = aspectRatioFromSerialized(savedLayout) ?? "1:1";
  const base = createDefaultTemplateLayout({ templateId: "clinic-education-card", aspectRatio: savedAspect });
  return hydrateTemplateLayout(base, savedLayout);
}

function aspectRatioFromSerialized(serialized: string | null): TemplateAspectRatio | undefined {
  if (!serialized) return undefined;
  try {
    const parsed = JSON.parse(serialized) as { aspectRatio?: string };
    return parsed.aspectRatio === "1:1" || parsed.aspectRatio === "4:5" || parsed.aspectRatio === "9:16" || parsed.aspectRatio === "16:9"
      ? parsed.aspectRatio
      : undefined;
  } catch {
    return undefined;
  }
}
