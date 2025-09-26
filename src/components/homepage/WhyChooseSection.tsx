
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Clock, Cpu, RefreshCw } from 'lucide-react';

const WhyChooseSection = () => {
  const differentials = [
    {
      icon: Cpu,
      title: "Tecnologia de Ponta",
      description: "Powered by Google Cloud com Vertex AI e Gemini, garantindo análises precisas e atualizadas."
    },
    {
      icon: Shield,
      title: "Segurança e Privacidade",
      description: "Máxima proteção de dados com criptografia avançada e conformidade com regulamentações de privacidade."
    },
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Otimize sua rotina clínica com diagnósticos mais rápidos e gestão eficiente de pacientes."
    },
    {
      icon: RefreshCw,
      title: "Atualização Contínua",
      description: "IA em constante aprendizado, sempre atualizada com as mais recentes descobertas veterinárias."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Seus Diferenciais
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Por que o PredictLab é a escolha ideal para sua clínica veterinária
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {differentials.map((item, index) => (
            <Card key={index} className="border border-gray-200 hover:border-vet-blue-300 transition-colors duration-300">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-vet-blue-600 to-vet-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
