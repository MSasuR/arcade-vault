"use client";

import React from "react";
import { useReveal } from "@/app/components/home/useReveal";
import HeroSection from "@/app/components/home/HeroSection";
import WhySection from "@/app/components/home/WhySection";
import GamesPreviewSection from "@/app/components/home/GamesPreviewSection";
import StatsSection from "@/app/components/home/StatsSection";
import ActivitySection from "@/app/components/home/ActivitySection";
import PricingSection from "@/app/components/home/PricingSection";
import FinalCTASection from "@/app/components/home/FinalCTASection";

export default function Home() {
  useReveal();

  return (
    <div className="home fade-in">
      <HeroSection />
      <WhySection />
      <GamesPreviewSection />
      <StatsSection />
      <ActivitySection />
      <PricingSection />
      <FinalCTASection />
    </div>
  );
}
