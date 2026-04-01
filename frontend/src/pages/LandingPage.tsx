import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import DripDivider from '@/components/landing/DripDivider';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      {/* Dot-grid texture */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle,grey,transparent_1px)] bg-[length:24px_24px]"
      />

      <Navbar />
      <HeroSection />

      {/* Hero → Features: dark cap drips down into light */}
      <DripDivider/>

      <FeaturesSection />

      {/* Features → How it works: drips transition into dark cap section */}
      <DripDivider flip={true} />

      <HowItWorksSection />

      {/* How it works → CTA: inverted drips bring us back to light */}
      <DripDivider/>

      <CtaSection />
      <Footer />
    </>
  );
}
