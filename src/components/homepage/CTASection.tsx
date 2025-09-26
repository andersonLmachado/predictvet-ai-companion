
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-vet-blue-600 to-vet-green-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Pronto para Transformar sua Prática Veterinária?
        </h2>
        
        <p className="text-xl text-white/90 mb-8 leading-relaxed">
          Junte-se aos veterinários que já estão usando a inteligência artificial 
          para oferecer um atendimento mais preciso e eficiente.
        </p>
        
        <Link to="/register">
          <Button 
            size="lg" 
            className="bg-white text-vet-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Começar Sua Jornada com o PredictLab
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
        
        <p className="text-white/70 text-sm mt-6">
          Teste gratuito • Sem cartão de crédito • Configuração em 2 minutos
        </p>
      </div>
    </section>
  );
};

export default CTASection;
