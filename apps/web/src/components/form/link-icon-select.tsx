import { LINK_ICON_PRESETS } from "@fsx/api/link-icons";

interface LinkIconSelectProps {
  value: string;
  onChange: (svg: string) => void;
}

export function LinkIconSelect({ value, onChange }: LinkIconSelectProps) {
  const matchingPreset = LINK_ICON_PRESETS.find((p) => p.svg === value);

  return (
    <select
      aria-label="Icon"
      className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm"
      value={matchingPreset?.label ?? LINK_ICON_PRESETS[0]?.label}
      onChange={(e) => {
        const preset = LINK_ICON_PRESETS.find((p) => p.label === e.target.value);
        if (preset) onChange(preset.svg);
      }}
    >
      {LINK_ICON_PRESETS.map((preset) => (
        <option key={preset.key} value={preset.label}>
          {preset.label}
        </option>
      ))}
    </select>
  );
}
