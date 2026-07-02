import assert from "node:assert/strict";
import test from "node:test";

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
} from "../src/features/templates/template-layout.ts";
import { conveyorStages, stageForCampaignState, stageStatuses } from "../src/features/generation/conveyor-flow.ts";

test("controlled layout overrides clamp CTA movement inside safe template bounds", () => {
  const layout = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "1:1",
  });

  const adjusted = applyElementOverride(layout, "cta", {
    x: -120,
    y: 1200,
    width: 980,
    height: 220,
  });
  const cta = adjusted.elements.cta;

  assert.equal(cta.x, adjusted.safeMargin);
  assert.equal(cta.y, adjusted.canvas.height - adjusted.safeMargin - cta.height);
  assert.equal(cta.width <= adjusted.canvas.width - adjusted.safeMargin * 2, true);
  assert.equal(cta.height <= 160, true);
  assert.equal(isLayoutSafe(adjusted).ok, true);
});

test("resetting one element keeps other final-adjust overrides intact", () => {
  const layout = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "4:5",
  });

  const withHeadline = applyElementOverride(layout, "headline", { x: 144, y: 180 });
  const withCta = applyElementOverride(withHeadline, "cta", { x: 180, y: 1120 });
  const resetCta = resetElementOverride(withCta, "cta");

  assert.equal(resetCta.elements.headline.x, withHeadline.elements.headline.x);
  assert.equal(resetCta.elements.headline.y, withHeadline.elements.headline.y);
  assert.deepEqual(resetCta.elements.cta, layout.elements.cta);
});

test("saved layout hydration restores only matching template and aspect overrides", () => {
  const layout = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "4:5",
  });
  const adjusted = applyElementOverride(layout, "headline", { x: 220, y: 420, width: 700 });
  const serialized = serializeTemplateLayout(adjusted);
  const restored = hydrateTemplateLayout(layout, serialized);

  assert.equal(restored.elements.headline.x, 220);
  assert.equal(restored.elements.headline.y, 420);
  assert.equal(restored.elements.headline.width, 700);
  assert.equal(isLayoutSafe(restored).ok, true);

  const differentAspect = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "9:16",
  });
  assert.deepEqual(hydrateTemplateLayout(differentAspect, serialized), differentAspect);
  assert.deepEqual(hydrateTemplateLayout(layout, "not-json"), layout);
});

test("saved layout hydration preserves controlled layer and font settings", () => {
  const layout = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "1:1",
  });
  const styled = applyElementOverride(
    applyElementOverride(layout, "headline", {
      fontFamily: "Georgia",
      fontSize: 58,
      fontWeight: 900,
      align: "center",
      visible: false,
    }),
    "cta",
    { locked: true },
  );
  const restored = hydrateTemplateLayout(layout, serializeTemplateLayout(styled));

  assert.equal(restored.elements.headline.fontFamily, "Georgia");
  assert.equal(restored.elements.headline.fontSize, 58);
  assert.equal(restored.elements.headline.fontWeight, 900);
  assert.equal(restored.elements.headline.align, "center");
  assert.equal(restored.elements.headline.visible, false);
  assert.equal(restored.elements.cta.locked, true);
});

test("background crop can pan to canvas edges without foreground safe-margin clamps", () => {
  const layout = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "1:1",
  });
  const cropped = applyElementOverride(layout, "background", {
    width: 1400,
    height: 1400,
    x: -260,
    y: -180,
  });

  assert.equal(cropped.elements.background.x, -260);
  assert.equal(cropped.elements.background.y, -180);
  assert.equal(isLayoutSafe(cropped).ok, true);
});

test("layout history supports undo and redo without keeping stale redo after a new edit", () => {
  const base = createDefaultTemplateLayout({
    templateId: "clinic-education-card",
    aspectRatio: "1:1",
  });
  const history = createLayoutHistory(base);
  const headlineMoved = applyElementOverride(base, "headline", { x: 200 });
  const withFirstEdit = pushLayoutHistory(history, headlineMoved);
  const ctaMoved = applyElementOverride(headlineMoved, "cta", { x: 240 });
  const withSecondEdit = pushLayoutHistory(withFirstEdit, ctaMoved);

  const undone = undoLayoutHistory(withSecondEdit);
  assert.equal(undone.current.elements.headline.x, 200);
  assert.equal(undone.current.elements.cta.x, base.elements.cta.x);

  const redone = redoLayoutHistory(undone);
  assert.equal(redone.current.elements.cta.x, 240);

  const alternate = pushLayoutHistory(undone, applyElementOverride(undone.current, "logo", { x: 160 }));
  assert.equal(alternate.future.length, 0);
});

test("conveyor stage mapping includes final adjustment between visuals and export", () => {
  assert.deepEqual(
    conveyorStages.map((stage) => stage.id),
    [
      "campaign_setup",
      "thirty_day_plan",
      "week_copy",
      "copy_approval",
      "visual_pack",
      "final_adjust",
      "export",
      "calendar",
    ],
  );

  assert.equal(stageForCampaignState({ hasCampaign: false }).id, "campaign_setup");
  assert.equal(stageForCampaignState({ hasCampaign: true, copyApproved: true, visualsReady: true }).id, "final_adjust");
  assert.equal(
    stageForCampaignState({
      hasCampaign: true,
      copyApproved: true,
      visualsReady: true,
      layoutAdjusted: true,
    }).id,
    "export",
  );
});

test("conveyor status model marks previous stages complete and future stages locked", () => {
  const statuses = stageStatuses("visual_pack");

  assert.equal(statuses.find((stage) => stage.id === "copy_approval")?.status, "complete");
  assert.equal(statuses.find((stage) => stage.id === "visual_pack")?.status, "current");
  assert.equal(statuses.find((stage) => stage.id === "final_adjust")?.status, "locked");
});
