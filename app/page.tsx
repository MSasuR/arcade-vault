import RevealObserver from "@/app/components/home/RevealObserver";
import HeroSection from "@/app/components/home/HeroSection";
import WhySection from "@/app/components/home/WhySection";
import GamesPreviewSection from "@/app/components/home/GamesPreviewSection";
import StatsSection from "@/app/components/home/StatsSection";
import ActivitySection from "@/app/components/home/ActivitySection";
import PricingSection from "@/app/components/home/PricingSection";
import FinalCTASection from "@/app/components/home/FinalCTASection";
import { getGames } from "@/lib/games";

export default async function Home() {
  const games = await getGames();

  return (
    <div className="home fade-in">
      <RevealObserver />
      <HeroSection />
      <WhySection />
      <GamesPreviewSection games={games} />
      <StatsSection />
      <ActivitySection />
      <PricingSection />
      <FinalCTASection />
    </div>
  );
}
