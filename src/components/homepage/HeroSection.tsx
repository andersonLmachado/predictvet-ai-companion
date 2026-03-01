import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import predictlabLogo from '@/assets/predictlab-logo-full.png';
import predictlabIcon from '@/assets/predictlab-icon-new.png';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col bg-background">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={predictlabIcon} alt="PredictLab" className="w-10 h-10 object-contain mix-blend-multiply dark:mix-blend-screen" />
          <span className="text-xl font-bold text-foreground tracking-tight">PredictLab</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Entrar
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-gradient-to-r from-[#2564e9] to-[#05956a] hover:opacity-90 text-white border-0">
              Criar Conta
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <img
            src={predictlabLogo}
            alt="PredictLab - Inteligência Artificial Veterinária"
            className="w-48 h-48 md:w-60 md:h-60 object-contain mx-auto mix-blend-multiply dark:mix-blend-screen"
          />

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Inteligência Artificial a Serviço do{' '}
            <span className="text-primary">Diagnóstico Veterinário</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Otimize seu tempo, aprimore decisões clínicas e gerencie sua clínica com tecnologia de ponta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#2564e9] to-[#05956a] hover:opacity-90 text-white border-0 px-8 text-base">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-border text-foreground hover:bg-accent px-8 text-base">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
