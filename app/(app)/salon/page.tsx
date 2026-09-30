import HallOfFame from "@/app/components/HallOfFame";
import { getGames } from "@/lib/games";

export default async function SalonPage() {
  const games = await getGames();

  return <HallOfFame games={games} />;
}
