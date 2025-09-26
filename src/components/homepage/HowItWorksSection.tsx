
import React from 'react';
import { UserPlus, Users, MessageCircle } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      number: "1",
      icon: UserPlus,
      title: "Cadastre-se ou Faça Login",
      description: "Crie sua conta gratuita em poucos minutos e acesse todas as funcionalidades do PredictLab."
    },
    {
      number: "2",
      icon: Users,
      title: "Cadastre Seus Pacientes",
      description: "Adicione informações dos pets e tutores de forma organizada e segura."
    },
    {
      number: "3",
      icon: MessageCircle,
      title: "Converse com a IA",
      description: "Descreva os sintomas e receba análises inteligentes para auxiliar no diagnóstico."
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-vet-blue-50 to-vet-green-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Três Passos Simples para Começar
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comece a usar o PredictLab hoje mesmo e transforme sua prática veterinária
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              {/* Connection line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-vet-blue-300 to-vet-green-300 transform -translate-x-1/2 z-0" />
              )}
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-r from-vet-blue-600 to-vet-green-600 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                  <step.icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-vet-blue-600">{step.number}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
