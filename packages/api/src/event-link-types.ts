// Event-owned links are limited to these three recurring types. The label and
// icon are derived from the type when creating an event link (see
// routers/events.ts). Directory links on /links keep the flexible label + icon
// model and aren't restricted to these types.
export const EVENT_LINK_TYPES = [
	{ value: "regulation", label: "Regulamento" },
	{ value: "form", label: "Formulário" },
	{ value: "results", label: "Chess-Results" },
] as const

export type EventLinkType = (typeof EVENT_LINK_TYPES)[number]["value"]

const EVENT_LINK_TYPE_VALUES = EVENT_LINK_TYPES.map((t) => t.value) as string[]

// Coerce a stored/legacy link into one of the three event link types. Event
// links created before the `type` column exist in the DB with type "link" (the
// column default); this maps them back based on their label, defaulting to
// "regulation".
export function resolveEventLinkType(type: string | null, label: string): EventLinkType {
  if (type && EVENT_LINK_TYPE_VALUES.includes(type)) return type as EventLinkType
  const l = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (/form|inscr|cadast/.test(l)) return "form"
  if (/regul|edital/.test(l)) return "regulation"
  if (/result|classific|chessresult/.test(l)) return "results"
  return "regulation"
}
