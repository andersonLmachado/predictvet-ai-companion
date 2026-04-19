import React from 'react';
import HeroSection from '@/components/homepage/HeroSection';
import ProblemSection from '@/components/homepage/ProblemSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import ClinicalIntelligenceSection from '@/components/homepage/ClinicalIntelligenceSection';
import MetricsSection from '@/components/homepage/MetricsSection';
import HowToStartSection from '@/components/homepage/HowToStartSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ClinicalIntelligenceSection />
      <MetricsSection />
      <HowToStartSection />
    </div>
  );
};

export default Index;
