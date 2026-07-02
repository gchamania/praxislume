import { Mic, Play, Scissors, Subtitles, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";

export default function MediaStudioPage() {
  return (
    <AppShell title="Media Studio" subtitle="Deferred media-studio-lite placeholder. No video processing is connected.">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          <div className="flex min-h-[460px] items-center justify-center bg-slate-950 p-8 text-white">
            <div className="text-center">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <Play className="h-9 w-9" />
              </div>
              <h2 className="font-display text-3xl font-extrabold">Doctor reel preview</h2>
              <p className="mt-3 text-slate-300">Upload raw doctor video and apply branding later.</p>
              <Button variant="secondary" className="mt-8"><Upload className="h-5 w-5" />Upload sample video</Button>
            </div>
          </div>
        </Card>
        <div className="space-y-5">
          {[
            ["Hook generator", Mic, "Create a patient-friendly opening line."],
            ["Lower-third overlay", Scissors, "Add clinic name and doctor title."],
            ["Subtitle file", Subtitles, "Draft captions for manual review."],
          ].map(([title, Icon, body], index) => (
            <Card key={String(title)} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-extrabold">{String(title)}</h2>
                    <Badge tone={index === 0 ? "indigo" : "slate"}>Dummy</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{String(body)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
