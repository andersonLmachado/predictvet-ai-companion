import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 px-6 md:px-12 bg-gradient-to-r from-[#2564e9] to-[#05956a]">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
          Pronto para Transformar sua Clínica?
        </h2>
        <p className="text-primary-foreground/80 text-lg">
          Junte-se aos veterinários que já usam IA para atender com mais precisão e eficiência.
        </p>
        <Link to="/register">
          <Button size="lg" variant="secondary" className="mt-4 px-8 text-base font-semibold">
            Começar Gratuitamente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-primary-foreground/60 text-sm">Sem cartão de crédito • Configuração em 2 minutos</p>
      </div>
    </section>
  );
};

export default CTASection;
