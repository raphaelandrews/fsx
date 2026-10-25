import { parseCategoryList, stringifyCategoryList, type SelectOption } from "@/lib/reference-options";

export function CategoryChecklist({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
}) {
  const selected = new Set(parseCategoryList(value));
  const toggle = (category: string) => {
    const next = new Set(selected);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    onChange(stringifyCategoryList(options.map((option) => option.value).filter((name) => next.has(name))));
  };
  return (
    <fieldset id={id} className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={selected.has(option.value)}
            onChange={() => toggle(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
