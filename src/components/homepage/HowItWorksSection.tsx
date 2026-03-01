import React from 'react';
import { UserPlus, PawPrint, MessageCircle } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    { number: '01', icon: UserPlus, title: 'Crie sua conta', description: 'Cadastro gratuito em menos de 2 minutos.' },
    { number: '02', icon: PawPrint, title: 'Cadastre pacientes', description: 'Adicione pets e tutores de forma organizada.' },
    { number: '03', icon: MessageCircle, title: 'Use a IA', description: 'Analise exames e conduza consultas assistidas.' },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Como Funciona</h2>
          <p className="text-muted-foreground text-lg">Três passos simples para transformar sua prática.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number} className="text-center space-y-4">
              <span className="text-5xl font-bold text-primary/20">{step.number}</span>
              <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
