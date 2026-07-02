"use client";

import dynamic from "next/dynamic";

export const KonvaFinalAdjusterLoader = dynamic(
  () => import("./konva-final-adjuster").then((module) => module.KonvaFinalAdjuster),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-100 bg-white text-sm font-bold text-slate-500">
        Loading final adjuster...
      </div>
    ),
  },
);
