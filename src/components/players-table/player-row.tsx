import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface Props {
  id: number;
}


export const PlayerRow = ({ id }: Props) => {
  /*const [player, setPlayer] = useState<PlayerProfile>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      const response = await getPlayer(id);
      setCurrentPlayer(response.player);
      setPlayer(response);
      setLoading(false);
    };
    fetchPlayer();
  }, [id]);

  if (!player) {
    return null;
  }*/

  /*return (
    <div className="flex items-center gap-3 p-3 cursor-pointer">
      <Avatar className="w-20 h-20 rounded-md">
        <AvatarImage
          src={player.image_url ? player.image_url : ""}
          alt={player.name}
        />
        <AvatarFallback className="rounded-md">F</AvatarFallback>
      </Avatar>
      <p className="font-medium whitespace-nowrap">
        <span className="text-gold">
          {player?.players_to_titles?.[0].titles.short_title}
        </span>{" "}
        {player.nickname ? player.nickname : player.name}
      </p>
    </div>
  );*/
  return <></>
};
