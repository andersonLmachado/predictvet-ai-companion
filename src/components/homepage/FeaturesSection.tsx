import React from 'react';
import {
  ClipboardList,
  FileText,
  FlaskConical,
  BarChart3,
  Scan,
  LayoutDashboard,
} from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    title: 'Anamnese guiada com IA',
    description:
      'Perguntas clínicas específicas por tema, estruturando o relato do tutor de forma padronizada e completa.',
    accent: 'hsl(162,70%,38%)',
    tag: 'Clínico',
    comingSoon: false,
  },
  {
    icon: FileText,
    title: 'SOAP automático',
    description:
      'Prontuário SOAP gerado automaticamente a partir da anamnese, com suspeitas diagnósticas e plano terapêutico.',
    accent: 'hsl(221,73%,45%)',
    tag: 'Prontuário',
    comingSoon: false,
  },
  {
    icon: FlaskConical,
    title: 'Análise de exames',
    description:
      'Upload de hemogramas e painéis bioquímicos com interpretação automática por IA e identificação de desvios.',
    accent: 'hsl(217,88%,57%)',
    tag: 'Laboratorial',
    comingSoon: false,
  },
  {
    icon: BarChart3,
    title: 'Comparativo de exames',
    description:
      'Linha de tendência entre exames consecutivos para visualizar a evolução de parâmetros ao longo do tempo.',
    accent: 'hsl(18,76%,50%)',
    tag: 'Analytics',
    comingSoon: false,
  },
  {
    icon: Scan,
    title: 'Laudo ultrassonográfico',
    description:
      'Roteiro guiado por voz ou texto para estruturar laudos de ultrassonografia de forma padronizada.',
    accent: 'hsl(258,52%,50%)',
    tag: 'Diagnóstico',
    comingSoon: false,
  },
  {
    icon: LayoutDashboard,
    title: 'Painel do tutor',
    description:
      'Área exclusiva para o tutor acompanhar o histórico e evolução do animal de forma clara e acessível.',
    accent: 'hsl(222,20%,55%)',
    tag: 'em breve',
    comingSoon: true,
  },
] as const;

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="py-24 px-6 md:px-12"
      style={{ background: 'hsl(213,100%,98%)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{
              background: 'hsl(217,100%,95%)',
              border: '1px solid hsl(217,50%,85%)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'hsl(221,73%,45%)' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{
                color: 'hsl(221,73%,45%)',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              Funcionalidades
            </span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
          >
            Tudo que você precisa em uma consulta
          </h2>
        </div>

        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,90%)',
                boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
                opacity: f.comingSoon ? 0.75 : 1,
              }}
            >
              {/* Topo colorido */}
              <div className="h-1" style={{ background: f.accent }} />

              <div className="p-6 space-y-4">
                {/* Tag */}
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${f.accent}18`,
                    color: f.accent,
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {f.tag}
                </span>

                {/* Ícone */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${f.accent}15` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>

                {/* Texto */}
                <div>
                  <h3
                    className="text-base font-bold mb-2"
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      color: f.comingSoon
                        ? 'hsl(222,20%,55%)'
                        : 'hsl(222,77%,15%)',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: 'hsl(222,30%,55%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    {f.description}
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
