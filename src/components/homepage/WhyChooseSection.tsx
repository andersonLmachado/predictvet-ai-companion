import React from 'react';
import { Check, X } from 'lucide-react';

const WhyChooseSection = () => {
  const features = [
    'Análise de exames por IA',
    'Consulta guiada com SOAP automático',
    'Dashboard de evolução clínica',
    'Relatório de alta inteligente',
    'Gestão completa de pacientes',
    'Comparativo de parâmetros laboratoriais',
    'Sugestões de diagnóstico por IA',
    'Acesso em qualquer dispositivo',
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            PredictLab vs. Sistemas Tradicionais
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja como a gestão inteligente com IA se compara aos softwares veterinários convencionais.
          </p>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 bg-muted/50">
            <div className="p-4 text-sm font-semibold text-muted-foreground">Funcionalidade</div>
            <div className="p-4 text-sm font-semibold text-primary text-center border-x border-border">PredictLab</div>
            <div className="p-4 text-sm font-semibold text-muted-foreground text-center">Outros Sistemas</div>
          </div>

          {/* Rows */}
          {features.map((feature, i) => (
            <div
              key={feature}
              className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'} ${i < features.length - 1 ? 'border-b border-border/50' : ''}`}
            >
              <div className="p-4 text-sm text-foreground flex items-center">{feature}</div>
              <div className="p-4 flex items-center justify-center border-x border-border/50">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="p-4 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-4 h-4 text-destructive" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
