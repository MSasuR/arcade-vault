"use client";

import { useReveal } from "@/app/components/home/useReveal";
import AboutHero from "@/app/components/about/AboutHero";
import AboutDivider from "@/app/components/about/AboutDivider";
import ContactForm from "@/app/components/about/ContactForm";

export default function AboutPage() {
  useReveal();

  return (
    <div className="about fade-in">
      <AboutHero />
      <AboutDivider />
      <ContactForm />
    </div>
  );
}
