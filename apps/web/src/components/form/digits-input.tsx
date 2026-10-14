import type { ComponentProps } from "react";

import { Input } from "@fsx/ui/components/input";

/**
 * A numeric text field that only ever holds digits: typing or pasting letters, signs, or spaces drops them,
 * unlike `type="number"`, which accepts "e", and a plain text input, which accepts anything. Use it for
 * years and identifiers, where leading zeros or spinner arrows make no sense.
 */
export function DigitsInput({ onValueChange, value, ...props }: Omit<ComponentProps<typeof Input>, "onChange" | "type" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(event) => onValueChange(event.target.value.replace(/\D/g, ""))}
    />
  );
}
