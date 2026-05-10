import EmailPreview from "@/components/marketing/EmailPreview";
import Footer from "@/components/marketing/Footer";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Nav from "@/components/marketing/Nav";
import Pricing from "@/components/marketing/Pricing";
import SignalPanel from "@/components/marketing/SignalPanel";
import StatsBar from "@/components/marketing/StatsBar";

export default function MarketingHome() {
  return (
    <main className="page">
      <Nav />
      <div className="hero-grid">
        <Hero />
        <div id="examples" className="hero-right">
          <EmailPreview />
          <SignalPanel />
        </div>
      </div>
      <StatsBar />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  );
}
