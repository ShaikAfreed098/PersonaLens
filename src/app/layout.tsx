import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "PersonaLens — Adaptive Behavioral Intelligence Platform",
  description: "PersonaLens is a modern AI-powered behavioral intelligence platform that dynamically analyzes thinking patterns, decision-making style, emotional resilience, motivations, and values.",
  keywords: "behavioral analysis, personality archetype, psychological profiling, adaptive assessment, Gemini AI, talent intelligence",
  authors: [{ name: "PersonaLens Team" }],
  openGraph: {
    title: "PersonaLens — Adaptive Behavioral Intelligence Platform",
    description: "Analyze and predict behavioral patterns dynamically using adaptive AI assessments.",
    type: "website",
    url: "https://personalens.ai",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}

