import { useMemo } from "react";

import { getGradient } from "@/lib/generate-gradients";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  id: number;
  name: string | undefined;
  imageUrl?: string | null;
}

export const ActionsClub = ({ id, name, imageUrl }: Props) => {
  const gradient = useMemo(() => getGradient(id), [id]);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="w-8 h-8 rounded-md">
        <AvatarImage src={imageUrl || undefined} alt={name} className="object-contain"  />
        <AvatarFallback style={gradient} />
      </Avatar>
      <div className="font-medium whitespace-nowrap">{name}</div>
    </div>
  );
};
