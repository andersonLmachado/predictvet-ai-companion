import React from 'react';
import { FlaskConical, Stethoscope, Users, BarChart3 } from 'lucide-react';

const services = [
  {
    icon: FlaskConical,
    title: 'Análise de Exames',
    description: 'Upload de hemogramas e urinálises com interpretação automática por IA, identificando valores fora da referência.',
    accent: 'hsl(221,73%,45%)',
    tag: 'Laboratorial',
  },
  {
    icon: Stethoscope,
    title: 'Consulta Guiada',
    description: 'Anamnese assistida com geração automática de notas SOAP, sugestões de diagnóstico e planos terapêuticos.',
    accent: 'hsl(162,70%,38%)',
    tag: 'Clínico',
  },
  {
    icon: Users,
    title: 'Gestão de Pacientes',
    description: 'Cadastro completo de pacientes e tutores, histórico clínico centralizado e relatórios de alta inteligentes.',
    accent: 'hsl(352,76%,44%)',
    tag: 'Gestão',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Clínico',
    description: 'Gráficos de evolução laboratorial, tendências de parâmetros e visão consolidada do histórico do paciente.',
    accent: 'hsl(18,76%,50%)',
    tag: 'Analytics',
  },
];

const FeaturesSection = () => {
  return (
    <section
      className="py-24 px-6 md:px-12"
      style={{ background: 'hsl(213,100%,98%)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{
              background: 'hsl(217,100%,95%)',
              border: '1px solid hsl(217,50%,85%)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(221,73%,45%)' }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'hsl(221,73%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              Funcionalidades
            </span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
          >
            Sua decisão diagnóstica com inteligência de precisão
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Ferramentas de IA integradas para uma prática veterinária moderna e eficiente.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group pl-card-hover rounded-2xl overflow-hidden"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,90%)',
                boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
              }}
            >
              {/* Colored top accent */}
              <div
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${service.accent}, ${service.accent}99)` }}
              />

              <div className="p-6 space-y-4">
                {/* Tag */}
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${service.accent}15`,
                    color: service.accent,
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {service.tag}
                </span>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${service.accent}12` }}
                >
                  <service.icon className="w-6 h-6" style={{ color: service.accent }} />
                </div>

                {/* Text */}
                <div>
                  <h3
                    className="text-base font-bold mb-2"
                    style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
                  >
                    {service.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
                  >
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
