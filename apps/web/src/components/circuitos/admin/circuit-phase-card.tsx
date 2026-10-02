import { CircuitPodiumForm } from "./circuit-podium-form";
import { CircuitPhaseForm } from "./circuit-phase-form";
import type { CircuitPhase } from "../types";

export function CircuitPhaseCard({ circuitId, phase }: { circuitId: number; phase: CircuitPhase }) {
  const podiums = [...phase.circuitPodiums].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  return (
    <div className="space-y-2">
      <CircuitPhaseForm circuitId={circuitId} phase={phase} />
      <div className="ml-4 space-y-2 border-l pl-4">
        <p className="text-xs font-medium text-muted-foreground">Phase podiums</p>
        {podiums.map((podium) => (
          <CircuitPodiumForm
            key={podium.id}
            target={{ circuitPhaseId: phase.id }}
            podium={podium}
          />
        ))}
        <CircuitPodiumForm key={`new-${podiums.length}`} target={{ circuitPhaseId: phase.id }} />
      </div>
    </div>
  );
}
