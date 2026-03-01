import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FlaskConical, Stethoscope, Users, BarChart3 } from 'lucide-react';

const FeaturesSection = () => {
  const services = [
    {
      icon: FlaskConical,
      title: 'Análise de Exames',
      description: 'Upload de hemogramas e urinálises com interpretação automática por IA, identificando valores fora da referência.',
    },
    {
      icon: Stethoscope,
      title: 'Consulta Guiada',
      description: 'Anamnese assistida com geração automática de notas SOAP, sugestões de diagnóstico e planos terapêuticos.',
    },
    {
      icon: Users,
      title: 'Gestão de Pacientes',
      description: 'Cadastro completo de pacientes e tutores, histórico clínico centralizado e relatórios de alta inteligentes.',
    },
    {
      icon: BarChart3,
      title: 'Dashboard Clínico',
      description: 'Gráficos de evolução laboratorial, tendências de parâmetros e visão consolidada do histórico do paciente.',
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Nossos Serviços
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo o que você precisa para uma prática veterinária moderna e eficiente.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card key={service.title} className="border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto flex items-center justify-center">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
