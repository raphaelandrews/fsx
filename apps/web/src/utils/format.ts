export function padNumber(value: number, width = 3): string {
  return String(value).padStart(width, "0")
}
