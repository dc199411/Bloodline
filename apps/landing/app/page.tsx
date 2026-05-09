import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Ticker } from "@/components/site/Ticker";
import { DnaSection } from "@/components/site/DnaSection";
import { CycleSection } from "@/components/site/CycleSection";
import { ManifestoSection } from "@/components/site/ManifestoSection";
import { StatusSection } from "@/components/site/StatusSection";
import { CtaSection } from "@/components/site/CtaSection";
import { Footer } from "@/components/site/Footer";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="relative z-[1]">
        <Hero />
        <Ticker />
        <DnaSection />
        <CycleSection />
        <ManifestoSection />
        <StatusSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
