import React from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    num: '01',
    title: 'Cadastre o paciente',
    description:
      'Crie o perfil com dados do tutor, espécie, raça e histórico clínico.',
  },
  {
    num: '02',
    title: 'Inicie a consulta guiada',
    description:
      'Responda as perguntas clínicas estruturadas por categoria de queixa.',
  },
  {
    num: '03',
    title: 'Receba o SOAP completo',
    description:
      'A IA gera automaticamente o prontuário com suspeitas e plano terapêutico.',
  },
] as const;

const HowToStartSection = () => {
  return (
    <section className="py-24 px-6 md:px-12" style={{ background: '#ffffff' }}>
      <div className="max-w-2xl mx-auto text-center">
        {/* Label */}
        <div
          className="text-xs font-semibold uppercase mb-3"
          style={{
            color: 'hsl(162,70%,38%)',
            fontFamily: 'Nunito Sans, sans-serif',
            letterSpacing: '0.1em',
          }}
        >
          Como começar
        </div>

        {/* Título */}
        <h2
          className="text-3xl md:text-4xl font-bold mb-12"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,12%)' }}
        >
          Em 3 passos você já está consultando com IA
        </h2>

        {/* Passos */}
        <div className="text-left mb-12">
          {steps.map(({ num, title, description }, i) => (
            <div
              key={num}
              className="flex gap-5 py-5"
              style={{
                borderBottom:
                  i < steps.length - 1 ? '0.5px solid #e0e0e0' : 'none',
              }}
            >
              <div
                className="text-xl font-semibold flex-shrink-0 w-8 pt-0.5"
                style={{ color: 'hsl(162,70%,38%)', fontFamily: 'Sora, sans-serif' }}
              >
                {num}
              </div>
              <div>
                <div
                  className="text-base font-semibold mb-1"
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    color: 'hsl(222,77%,12%)',
                  }}
                >
                  {title}
                </div>
                <div
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: 'Nunito Sans, sans-serif',
                    color: 'hsl(222,30%,55%)',
                  }}
                >
                  {description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link to="/register">
          <button
            className="px-10 py-4 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
            style={{
              background:
                'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
              boxShadow: '0 8px 32px -8px hsla(221,73%,45%,0.5)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            Começar gratuitamente
          </button>
        </Link>
      </div>
    </section>
  );
};

export default HowToStartSection;
