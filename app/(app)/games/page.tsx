import Library from "@/app/components/Library";
import { getGames } from "@/lib/games";

export default async function GamesPage() {
  const games = await getGames();

  return <Library games={games} />;
}
