import React from 'react';

const insights = [
  {
    dot: '#E24B4A',
    title: 'Parâmetros em queda progressiva',
    text: 'Quando um indicador cai consistentemente entre exames, o sistema sinaliza antes que atinja valores críticos.',
    example:
      '"Hematócrito caiu 18% nos últimos 3 exames — ainda dentro da referência, mas com tendência de queda."',
  },
  {
    dot: '#1D9E75',
    title: 'Resposta ao tratamento',
    text: 'Compara exames antes e depois de uma intervenção e mostra quais parâmetros responderam ao protocolo.',
    example: '"Eritrócitos retornou à faixa de referência (5.26 → 7.15) após suplementação."',
  },
  {
    dot: '#EF9F27',
    title: 'Correlações entre órgãos',
    text: 'Identifica quando múltiplos parâmetros relacionados se alteram juntos, sugerindo investigação direcionada.',
    example:
      '"Creatinina elevada + pelve renal dilatada no ultrassom — correlacionar com estadiamento IRIS."',
  },
  {
    dot: '#534AB7',
    title: 'Alertas precoces',
    text: 'Parâmetros ainda dentro da referência mas com variação significativa entre exames são destacados para monitoramento.',
    example:
      '"Plaquetas variou 321% e permanece fora da referência — recomenda-se acompanhamento mais próximo."',
  },
] as const;

const howSteps = [
  {
    num: '01',
    title: 'Dados reais, não suposições',
    text: 'Cada análise é baseada nos exames reais do paciente armazenados no histórico — não em médias populacionais genéricas.',
  },
  {
    num: '02',
    title: 'A IA interpreta, o veterinário decide',
    text: 'Os insights são sugestões clínicas auditáveis — o veterinário sempre tem a palavra final sobre conduta e diagnóstico.',
  },
  {
    num: '03',
    title: 'Quanto mais exames, mais preciso',
    text: 'O sistema melhora com o tempo. Com dois exames você vê variação. Com cinco, você vê uma tendência. Com dez, você vê um padrão.',
  },
] as const;

const ClinicalIntelligenceSection = () => {
  return (
    <section
      className="py-24 px-6 md:px-12"
      style={{ background: 'hsl(222,77%,10%)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Label */}
        <div
          className="text-xs font-semibold uppercase mb-3"
          style={{
            color: 'hsl(162,70%,55%)',
            fontFamily: 'Nunito Sans, sans-serif',
            letterSpacing: '0.1em',
          }}
        >
          Inteligência clínica
        </div>

        {/* Título */}
        <h2
          className="text-2xl md:text-3xl font-semibold mb-4"
          style={{
            fontFamily: 'Sora, sans-serif',
            color: 'hsl(213,100%,97%)',
            lineHeight: 1.3,
          }}
        >
          A IA não substitui o veterinário — ela amplifica o que ele já sabe
        </h2>

        {/* Parágrafo intro */}
        <p
          className="text-base leading-relaxed"
          style={{
            color: 'hsla(213,100%,88%,0.6)',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          O PredictLab analisa os dados clínicos do paciente ao longo do tempo e
          identifica padrões que seriam difíceis de perceber consulta a consulta. Não
          são predições absolutas — são alertas baseados em tendências reais, para que
          o veterinário tome decisões com mais informação.
        </p>

        {/* Grid de insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {insights.map(({ dot, title, text, example }) => (
            <div
              key={title}
              className="rounded-xl p-5"
              style={{
                background: 'hsla(0,0%,100%,0.05)',
                border: '0.5px solid hsla(0,0%,100%,0.12)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: dot }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: 'hsl(213,100%,97%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  {title}
                </span>
              </div>
              <p
                className="text-xs leading-relaxed mb-2"
                style={{
                  color: 'hsla(213,100%,88%,0.6)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {text}
              </p>
              <p
                className="text-xs italic leading-relaxed px-3 py-2 rounded-lg"
                style={{
                  color: 'hsla(213,100%,80%,0.5)',
                  background: 'hsla(0,0%,100%,0.06)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {example}
              </p>
            </div>
          ))}
        </div>

        {/* Como funciona */}
        <div className="mt-10">
          <div
            className="text-xs font-semibold uppercase mb-4"
            style={{
              color: 'hsl(162,70%,55%)',
              fontFamily: 'Nunito Sans, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            Como funciona
          </div>

          <div>
            {howSteps.map(({ num, title, text }, i) => (
              <div
                key={num}
                className="flex gap-4 py-5"
                style={{
                  borderBottom:
                    i < howSteps.length - 1
                      ? '0.5px solid hsla(0,0%,100%,0.1)'
                      : 'none',
                }}
              >
                <div
                  className="text-2xl font-semibold flex-shrink-0 w-8"
                  style={{
                    color: 'hsl(162,70%,55%)',
                    fontFamily: 'Sora, sans-serif',
                  }}
                >
                  {num}
                </div>
                <div>
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{
                      color: 'hsl(213,100%,97%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    {title}
                  </div>
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      color: 'hsla(213,100%,88%,0.6)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="mt-6 text-xs leading-relaxed p-4"
          style={{
            color: 'hsla(213,100%,88%,0.45)',
            background: 'hsla(0,0%,100%,0.04)',
            borderLeft: '3px solid #1D9E75',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        >
          O PredictLab é uma ferramenta de apoio à decisão clínica. Os alertas e
          insights gerados não substituem o julgamento do médico veterinário
          habilitado. A prescrição, o diagnóstico e a conduta terapêutica são de
          responsabilidade exclusiva do profissional.
        </div>
      </div>
    </section>
  );
};

export default ClinicalIntelligenceSection;
