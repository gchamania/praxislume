import Link from "next/link";
import { ArrowRight, GitBranch, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { ConveyorBelt } from "@/features/generation/conveyor-belt";

export default function GeneratePage() {
  return (
    <AppShell
      title="Create 30-Day Plan"
      subtitle="This compatibility route now starts the campaign conveyor."
      action={
        <Link href="/campaigns/new">
          <Button>
            <Sparkles className="h-5 w-5" /> Create 30-Day Plan
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <ConveyorBelt activeStage="campaign_setup" compact />
        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <Badge tone="indigo">Compatibility route</Badge>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-slate-950">Generation now runs through the campaign conveyor</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Start with campaign setup, review the 30-day plan, approve Week 1 copy, create visuals, make controlled final adjustments, and export manually.
              </p>
            </div>
            <GitBranch className="h-10 w-10 text-indigo-500" />
          </div>
          <div className="mt-6">
            <Link href="/campaigns/new">
              <Button>
                Open Campaign Conveyor <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
