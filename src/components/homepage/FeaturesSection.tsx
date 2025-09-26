
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Users, FileText, Zap } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Diagnóstico Assistido por IA",
      description: "Análise inteligente de sintomas e sugestões de perguntas direcionadas para otimizar o processo diagnóstico."
    },
    {
      icon: Users,
      title: "Gestão Completa de Pacientes",
      description: "Centralize todos os dados de pets e tutores em um sistema organizado e de fácil acesso."
    },
    {
      icon: FileText,
      title: "Análise de Exames (Em Breve)",
      description: "Futura capacidade de interpretar resultados de exames laboratoriais e de imagem com precisão."
    },
    {
      icon: Zap,
      title: "Acesso Rápido e Intuitivo",
      description: "Interface amigável e responsiva, projetada especificamente para o fluxo de trabalho veterinário."
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Principais Funcionalidades
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubra como o PredictLab pode revolucionar sua prática veterinária
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-vet-blue-600 to-vet-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
