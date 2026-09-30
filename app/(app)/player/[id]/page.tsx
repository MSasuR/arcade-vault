import GamePlayer from "@/app/components/GamePlayer";
import { getGame } from "@/lib/games";

export default async function GamePlayerPage({ params }: PageProps<"/player/[id]">) {
  const { id } = await params;
  const game = await getGame(id);

  return <GamePlayer game={game} />;
}
