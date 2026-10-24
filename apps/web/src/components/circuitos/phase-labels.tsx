import { createContext, useContext } from "react";

import type { Circuit } from "./types";

// Stage columns use short labels ("E1") because tournament names are long; the stage list above the table is the legend.
const PhaseLabels = createContext<Record<string, string>>({});

export const PhaseLabelsProvider = PhaseLabels.Provider;

export function phaseLabels(circuit: Circuit): Record<string, string> {
  return Object.fromEntries(
    [...circuit.circuitPhases]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((phase, index) => [phase.tournament?.name ?? `Etapa ${phase.sortOrder}`, `E${index + 1}`]),
  );
}

export function usePhaseLabel(phase: string) {
  return useContext(PhaseLabels)[phase] ?? phase;
}

export function PhaseName({ phase }: { phase: string }) {
  return <span title={phase}>{usePhaseLabel(phase)}</span>;
}
