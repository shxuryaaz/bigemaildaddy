import EmailPreview from "@/components/marketing/EmailPreview";
import Footer from "@/components/marketing/Footer";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Nav from "@/components/marketing/Nav";
import Pricing from "@/components/marketing/Pricing";
import StatsBar from "@/components/marketing/StatsBar";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-[#faf8f4]">
      <Nav />
      <Hero />
      <EmailPreview />
      <StatsBar />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  );
}
