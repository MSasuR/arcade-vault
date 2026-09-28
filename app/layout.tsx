import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono, Courier_Prime } from "next/font/google";
import "./globals.css";
import AppLayout from "./components/AppLayout";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start-2p",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-courier-prime",
});

export const metadata: Metadata = {
  title: "Arcade Vault · Portal Retro",
  description: "Arcade Vault — bóveda retro de videojuegos clásicos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${pressStart2P.variable} ${jetbrainsMono.variable} ${courierPrime.variable}`}
    >
      <body>
        <div className="av-bg" />
        <div className="av-noise" />
        <div id="root">
          <AppLayout>{children}</AppLayout>
        </div>
      </body>
    </html>
  );
}
