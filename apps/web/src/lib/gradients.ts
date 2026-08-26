export const meshGradients = [
  {
    backgroundColor: "oklch(0.93 0.03 80)",
    backgroundImage: `radial-gradient(at 73% 56%, oklch(0.86 0.12 85) 0px, transparent 50%), radial-gradient(at 68% 18%, oklch(0.84 0.09 355) 0px, transparent 50%), radial-gradient(at 33% 10%, oklch(0.85 0.10 12) 0px, transparent 50%), radial-gradient(at 89% 46%, oklch(0.86 0.09 40) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.92 0.03 200)",
    backgroundImage: `radial-gradient(at 92% 82%, oklch(0.82 0.06 220) 0px, transparent 50%), radial-gradient(at 68% 56%, oklch(0.82 0.09 170) 0px, transparent 50%), radial-gradient(at 10% 31%, oklch(0.82 0.10 165) 0px, transparent 50%), radial-gradient(at 94% 59%, oklch(0.82 0.06 200) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.93 0.03 290)",
    backgroundImage: `radial-gradient(at 93% 87%, oklch(0.85 0.09 290) 0px, transparent 50%), radial-gradient(at 83% 42%, oklch(0.84 0.10 291) 0px, transparent 50%), radial-gradient(at 93% 58%, oklch(0.84 0.09 283) 0px, transparent 50%), radial-gradient(at 43% 99%, oklch(0.84 0.08 265) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.92 0.04 150)",
    backgroundImage: `radial-gradient(at 22% 54%, oklch(0.82 0.12 150) 0px, transparent 50%), radial-gradient(at 8% 6%, oklch(0.82 0.09 170) 0px, transparent 50%), radial-gradient(at 61% 68%, oklch(0.82 0.10 165) 0px, transparent 50%), radial-gradient(at 53% 33%, oklch(0.82 0.06 200) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.92 0.04 260)",
    backgroundImage: `radial-gradient(at 98% 14%, oklch(0.84 0.08 265) 0px, transparent 50%), radial-gradient(at 8% 18%, oklch(0.82 0.06 220) 0px, transparent 50%), radial-gradient(at 97% 60%, oklch(0.82 0.12 270) 0px, transparent 50%), radial-gradient(at 8% 48%, oklch(0.82 0.06 200) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.93 0.04 60)",
    backgroundImage: `radial-gradient(at 10% 20%, oklch(0.85 0.10 45) 0px, transparent 50%), radial-gradient(at 80% 30%, oklch(0.86 0.12 85) 0px, transparent 50%), radial-gradient(at 40% 70%, oklch(0.86 0.09 40) 0px, transparent 50%), radial-gradient(at 90% 10%, oklch(0.85 0.10 12) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.93 0.03 10)",
    backgroundImage: `radial-gradient(at 20% 80%, oklch(0.84 0.09 355) 0px, transparent 50%), radial-gradient(at 90% 20%, oklch(0.85 0.10 12) 0px, transparent 50%), radial-gradient(at 60% 50%, oklch(0.86 0.09 40) 0px, transparent 50%), radial-gradient(at 10% 30%, oklch(0.86 0.12 85) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.92 0.04 285)",
    backgroundImage: `radial-gradient(at 30% 10%, oklch(0.84 0.10 291) 0px, transparent 50%), radial-gradient(at 70% 20%, oklch(0.85 0.09 290) 0px, transparent 50%), radial-gradient(at 10% 60%, oklch(0.84 0.09 283) 0px, transparent 50%), radial-gradient(at 80% 90%, oklch(0.84 0.08 265) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.93 0.03 170)",
    backgroundImage: `radial-gradient(at 10% 90%, oklch(0.82 0.09 170) 0px, transparent 50%), radial-gradient(at 20% 20%, oklch(0.82 0.10 165) 0px, transparent 50%), radial-gradient(at 60% 30%, oklch(0.82 0.12 150) 0px, transparent 50%), radial-gradient(at 90% 80%, oklch(0.82 0.06 220) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "oklch(0.92 0.04 275)",
    backgroundImage: `radial-gradient(at 80% 10%, oklch(0.82 0.12 270) 0px, transparent 50%), radial-gradient(at 20% 30%, oklch(0.84 0.08 265) 0px, transparent 50%), radial-gradient(at 50% 70%, oklch(0.84 0.10 291) 0px, transparent 50%), radial-gradient(at 10% 40%, oklch(0.85 0.09 290) 0px, transparent 50%)`,
  },
];

export function getGradient(id: number) {
  const index = Math.abs(id) % meshGradients.length;
  return meshGradients[index];
}
