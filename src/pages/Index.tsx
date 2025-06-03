
import React from 'react';
import HeroSection from '@/components/homepage/HeroSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import WhyChooseSection from '@/components/homepage/WhyChooseSection';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import TestimonialsSection from '@/components/homepage/TestimonialsSection';
import CTASection from '@/components/homepage/CTASection';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <WhyChooseSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Index;
