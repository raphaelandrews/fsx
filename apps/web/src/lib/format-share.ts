const number = new Intl.NumberFormat("pt-BR");

export function formatShare(share: number) {
  const percent = share * 100;
  if (percent === 0) return "0%";
  if (percent >= 1) return `${number.format(Math.round(percent))}%`;

  let fractionDigits = 1;
  let rounded = Math.round(percent * 10 ** fractionDigits);
  while (fractionDigits < 6 && (rounded === 0 || rounded >= 10 ** fractionDigits)) {
    fractionDigits += 1;
    rounded = Math.round(percent * 10 ** fractionDigits);
  }

  if (rounded === 0) return "<0,000001%";
  if (rounded >= 10 ** fractionDigits) return "<1%";

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(percent)}%`;
}
