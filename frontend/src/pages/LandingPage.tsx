import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import DripDivider from '../components/DripDivider';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import CtaSection from '../components/CtaSection';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      {/* Fixed dot-grid texture overlay */}
      <div
        id="dot-grid"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(74,90,58,0.055) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Navbar />
      <HeroSection />

      {/* Hero → Features: dark cap drips down into light */}
      <DripDivider dripColor="#2a2d2e" bgColor="#ede8df" />

      <FeaturesSection />

      {/* Features → How it works: drips transition into dark cap section */}
      <DripDivider dripColor="#2a2d2e" bgColor="#ede8df" />

      <HowItWorksSection />

      {/* How it works → CTA: inverted drips bring us back to light */}
      <DripDivider dripColor="#ede8df" bgColor="#2a2d2e" flip />

      <CtaSection />
      <Footer />
    </>
  );
}
