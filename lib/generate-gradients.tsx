const gradients = [
  'linear-gradient(to bottom right, #ef4444, #f97316)', //sunset
  'linear-gradient(to bottom right, #fb7185, #ef4444)', //poppy
  'linear-gradient(to bottom right, #ec4899, #f43f5e)', //rosebud
  'linear-gradient(to bottom right, #fde68a, #facc15)', //sunshine
  'linear-gradient(to bottom right, #fde68a, #eab308)', //gold 
  'linear-gradient(to bottom right, #f59e0b, #ec4899)', //twilight
  'linear-gradient(to bottom right, #ddd6fe, #fbcfe8)', //powder
  'linear-gradient(to bottom right, #bfdbfe, #a5f3fc)', //holly
  'linear-gradient(to bottom right, #99f6e4, #14b8a6)', //northern lights
  'linear-gradient(to bottom right, #a3e635, #84cc16)', //raw green
  'linear-gradient(to bottom right, #2dd4bf, #fef08a)', //lime
  'linear-gradient(to bottom right, #34d399, #22d3ee)', //nemesia
  'linear-gradient(to bottom right, #818cf8, #22d3ee)', //snowflake
  'linear-gradient(to bottom right, #06b6d4, #3b82f6)', //blue bird
  'linear-gradient(to bottom right, #6366f1, #3b82f6)', //blueprint
  'linear-gradient(to bottom right, #2563eb, #7c3aed)', //salvia
  'linear-gradient(to bottom right, #d946ef, #06b6d4)', //snowflake
  'linear-gradient(to bottom right, #c026d3, #db2777)', //heartsease
  'linear-gradient(to bottom right, #c026d3, #9333ea)', //amaranthus
  'linear-gradient(to bottom right, #d946ef, #ec4899)', //candy
  'linear-gradient(to bottom right, #8b5cf6, #a855f7)', //verbena
  'linear-gradient(to bottom right, #7c3aed, #4f46e5)', //clematis
  'linear-gradient(to bottom right, #a855f7, #581c87)', //hibiscus
  'linear-gradient(to bottom right, #1e40af, #312e81)', //clear night
  'linear-gradient(to bottom right, #d4d4d4, #a8a29e)', //clay
  'linear-gradient(to bottom right, #78716c, #44403c)', //soil
  'linear-gradient(to bottom right, #cbd5e1, #64748b)', //silver
  'linear-gradient(to bottom right, #10b981, #064e3b)', //fir tree
  'linear-gradient(to bottom right, #64748b, #1e293b)', //metal 
  'linear-gradient(to bottom right, #0f172a, #334155)', //darkness
];

export const getGradient = (seed: number): { backgroundImage: string } => {
  const safeIndex = Math.abs(seed) % gradients.length;
  return { backgroundImage: gradients[safeIndex] };
};
