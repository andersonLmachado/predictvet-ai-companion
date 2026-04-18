import React from 'react';
import {
  UserPlus,
  ClipboardList,
  Brain,
  FlaskConical,
  Building2,
  FileUp,
  Microscope,
  LayoutDashboard,
} from 'lucide-react';

interface Step {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  lineColor: string;
  badge?: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Cadastro',
    description:
      'Crie sua conta e cadastre seus pacientes com dados do tutor, espécie, raça e histórico.',
    color: 'hsl(270, 50%, 55%)',
    bgColor: 'hsla(270, 50%, 55%, 0.10)',
    borderColor: 'hsla(270, 50%, 55%, 0.30)',
    lineColor: 'hsla(270, 50%, 55%, 0.35)',
  },
  {
    number: 2,
    icon: ClipboardList,
    title: 'Anamnese guiada',
    description:
      'Responda perguntas clínicas específicas por tema. O relato do tutor é capturado de forma estruturada.',
    color: 'hsl(258, 52%, 50%)',
    bgColor: 'hsla(258, 52%, 50%, 0.10)',
    borderColor: 'hsla(258, 52%, 50%, 0.30)',
    lineColor: 'hsla(258, 52%, 50%, 0.35)',
  },
  {
    number: 3,
    icon: Brain,
    title: 'Análise e SOAP gerado',
    description:
      'A IA processa a anamnese e gera automaticamente o prontuário SOAP com suspeitas diagnósticas e plano terapêutico.',
    color: 'hsl(162, 70%, 38%)',
    bgColor: 'hsla(162, 70%, 38%, 0.10)',
    borderColor: 'hsla(162, 70%, 38%, 0.30)',
    lineColor: 'hsla(162, 70%, 38%, 0.35)',
  },
  {
    number: 4,
    icon: FlaskConical,
    title: 'Solicitação de exames',
    description:
      'Com base no SOAP, solicite os exames complementares indicados para o caso.',
    color: 'hsl(221, 73%, 45%)',
    bgColor: 'hsla(221, 73%, 45%, 0.10)',
    borderColor: 'hsla(221, 73%, 45%, 0.30)',
    lineColor: 'hsla(221, 73%, 45%, 0.35)',
  },
  {
    number: 5,
    icon: Building2,
    title: 'Envio para laboratório',
    description:
      'Encaminhe para laboratório interno ou externo. O PredictVet registra o laboratório responsável para rastreabilidade.',
    color: 'hsl(217, 88%, 52%)',
    bgColor: 'hsla(217, 88%, 52%, 0.10)',
    borderColor: 'hsla(217, 88%, 52%, 0.30)',
    lineColor: 'hsla(217, 88%, 52%, 0.35)',
  },
  {
    number: 6,
    icon: FileUp,
    title: 'Envio do laudo PDF',
    description:
      'Receba o laudo e anexe diretamente no histórico do paciente.',
    color: 'hsl(213, 85%, 48%)',
    bgColor: 'hsla(213, 85%, 48%, 0.10)',
    borderColor: 'hsla(213, 85%, 48%, 0.30)',
    lineColor: 'hsla(213, 85%, 48%, 0.35)',
  },
  {
    number: 7,
    icon: Microscope,
    title: 'Análise do laudo pela IA',
    description:
      'O PredictVet analisa o laudo, extrai data e laboratório automaticamente, e gera insights clínicos.',
    color: 'hsl(162, 70%, 38%)',
    bgColor: 'hsla(162, 70%, 38%, 0.10)',
    borderColor: 'hsla(162, 70%, 38%, 0.30)',
    lineColor: 'hsla(162, 70%, 38%, 0.35)',
  },
  {
    number: 8,
    icon: LayoutDashboard,
    title: 'Painel do tutor',
    description:
      'O tutor acessa um painel personalizado com o histórico e evolução do animal.',
    color: 'hsl(222, 20%, 55%)',
    bgColor: 'hsla(222, 20%, 55%, 0.08)',
    borderColor: 'hsla(222, 20%, 55%, 0.25)',
    lineColor: 'transparent',
    badge: 'em breve',
  },
];

const HowItWorksSection = () => {
  return (
    <section
      className="py-24 px-6 md:px-12"
      style={{ background: 'hsl(213, 100%, 98%)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 pl-animate-fade-up">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{
              background: 'hsla(221,73%,45%,0.08)',
              color: 'hsl(221,73%,45%)',
              fontFamily: 'Nunito Sans, sans-serif',
              border: '1px solid hsla(221,73%,45%,0.18)',
            }}
          >
            Fluxo clínico completo
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,12%)' }}
          >
            Como Funciona
          </h2>
          <p
            className="text-base md:text-lg"
            style={{ color: 'hsl(222,30%,50%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Da consulta ao resultado — tudo em uma plataforma integrada.
          </p>
        </div>

        {/* Roadmap */}
        <div className="relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.number} className="relative flex gap-5 md:gap-8">
                {/* Left: circle + connector line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Circle */}
                  <div
                    className="relative z-10 flex items-center justify-center rounded-full font-bold text-sm w-10 h-10 md:w-12 md:h-12 flex-shrink-0"
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      background: step.bgColor,
                      border: `2px solid ${step.borderColor}`,
                      color: step.color,
                      boxShadow: `0 0 0 4px ${step.bgColor}`,
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 mt-1"
                      style={{
                        background: `linear-gradient(to bottom, ${step.lineColor}, ${steps[index + 1].lineColor})`,
                        minHeight: '2.5rem',
                      }}
                    />
                  )}
                </div>

                {/* Right: content card */}
                <div
                  className={`flex-1 rounded-2xl p-5 md:p-6 transition-all duration-200 pl-card-hover ${isLast ? 'mb-0' : 'mb-4'}`}
                  style={{
                    background: 'white',
                    border: `1px solid hsl(217,50%,90%)`,
                    boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
                    opacity: step.badge ? 0.75 : 1,
                  }}
                >
                  {/* Colored top stripe */}
                  <div
                    className="h-0.5 rounded-full mb-4"
                    style={{ background: step.color, width: '40px' }}
                  />

                  <div className="flex items-start gap-4">
                    {/* Icon container */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: step.bgColor }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: step.color }}
                      />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3
                          className="text-base font-semibold"
                          style={{
                            fontFamily: 'Sora, sans-serif',
                            color: step.badge ? 'hsl(222,20%,55%)' : 'hsl(222,77%,12%)',
                          }}
                        >
                          {step.title}
                        </h3>
                        {step.badge && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              fontFamily: 'Nunito Sans, sans-serif',
                              background: 'hsl(222,20%,92%)',
                              color: 'hsl(222,20%,50%)',
                              border: '1px solid hsl(222,20%,85%)',
                            }}
                          >
                            {step.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontFamily: 'Nunito Sans, sans-serif',
                          color: 'hsl(222,30%,50%)',
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
