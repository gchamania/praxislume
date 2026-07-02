import assert from "node:assert/strict";
import test from "node:test";

import {
  finalAdjustCapabilities,
  mobileConveyorWindow,
  staffDefaultAction,
} from "../src/features/staff/mobile-staff-ux.ts";
import { conveyorStages } from "../src/features/generation/conveyor-flow.ts";

test("mobile conveyor window keeps the active stage with immediate context only", () => {
  const window = mobileConveyorWindow(conveyorStages, "visual_pack");

  assert.deepEqual(
    window.map((stage) => stage.id),
    ["copy_approval", "visual_pack", "final_adjust"],
  );
  assert.equal(window.find((stage) => stage.id === "visual_pack")?.position, "current");
});

test("mobile final adjust stays preview-first and avoids desktop-heavy editing", () => {
  const mobile = finalAdjustCapabilities("mobile");
  const desktop = finalAdjustCapabilities("desktop");

  assert.deepEqual(mobile.primaryControls, ["move", "reset", "aspect_ratio", "save"]);
  assert.equal(mobile.previewFirst, true);
  assert.equal(mobile.canResize, false);
  assert.equal(mobile.canExportPreview, false);
  assert.equal(desktop.canResize, true);
  assert.equal(desktop.canExportPreview, true);
});

test("staff defaults favor review, copy, and export before editing", () => {
  assert.deepEqual(staffDefaultAction("copy_needs_review", "active", "week-1"), {
    label: "Review copy",
    href: "/campaigns/active/weeks/week-1/copy",
    intent: "review",
  });
  assert.deepEqual(staffDefaultAction("ready_to_export", "active", "week-1"), {
    label: "Export weekly pack",
    href: "/campaigns/active/weeks/week-1/export",
    intent: "export",
  });
  assert.equal(staffDefaultAction("final_adjustment_needed", "active", "week-1").intent, "handoff_to_editor");
});
