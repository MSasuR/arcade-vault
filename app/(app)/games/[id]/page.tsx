import GameDetail from "@/app/components/GameDetail";
import { getGame } from "@/lib/games";

export default async function GameDetailPage({ params }: PageProps<"/games/[id]">) {
  const { id } = await params;
  const game = await getGame(id);

  return <GameDetail game={game} />;
}
