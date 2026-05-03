import EmailPreview from "@/components/marketing/EmailPreview";
import Hero from "@/components/marketing/Hero";
import Nav from "@/components/marketing/Nav";
import SignalPanel from "@/components/marketing/SignalPanel";
import StatsBar from "@/components/marketing/StatsBar";

export default function MarketingHome() {
  return (
    <main className="page">
      <Nav />
      <div className="hero-grid">
        <Hero />
        <div className="hero-right">
          <EmailPreview />
          <SignalPanel />
        </div>
      </div>
      <StatsBar />
    </main>
  );
}
