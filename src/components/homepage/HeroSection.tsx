import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Stethoscope, FlaskConical, Brain, Shield } from 'lucide-react';
import predictlabLogo from '@/assets/predictlab-logo-v26.png';

/* ── Floating badge component ── */
function FloatingBadge({
  icon: Icon,
  label,
  sub,
  style,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="absolute hidden lg:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl pl-animate-float"
      style={{
        background: 'hsla(0,0%,100%,0.07)',
        backdropFilter: 'blur(12px)',
        border: '1px solid hsla(217,88%,57%,0.25)',
        boxShadow: '0 8px 32px -8px hsla(221,73%,10%,0.4)',
        ...style,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'hsla(217,88%,57%,0.2)' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'hsl(217,90%,72%)' }} />
      </div>
      <div>
        <p className="text-xs font-bold" style={{ color: 'hsl(213,100%,95%)', fontFamily: 'Sora, sans-serif' }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: 'hsla(213,100%,80%,0.6)', fontFamily: 'Nunito Sans, sans-serif' }}>
          {sub}
        </p>
      </div>
    </div>
  );
}

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden pl-circuit-bg"
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 15% 25%, hsl(221,73%,22%) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 50% at 85% 75%, hsl(352,76%,18%) 0%, transparent 50%),' +
          'radial-gradient(ellipse 50% 40% at 60% 10%, hsl(217,88%,20%) 0%, transparent 50%),' +
          'linear-gradient(160deg, hsl(222,77%,10%) 0%, hsl(222,77%,16%) 100%)',
      }}
    >
      {/* ── Decorative glows ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: 'hsl(221,73%,45%)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-15"
          style={{ background: 'hsl(352,76%,44%)' }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          {/* White pill container so the logo shows on dark bg */}
          <div
            className="px-3 py-1.5 rounded-xl"
            style={{ background: 'hsla(0,0%,100%,0.95)', boxShadow: '0 2px 12px -4px hsla(221,73%,20%,0.3)' }}
          >
            <img src={predictlabLogo} alt="PredictLab" className="h-8 object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <button
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: 'hsla(213,100%,90%,0.75)', fontFamily: 'Nunito Sans, sans-serif' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'hsl(213,100%,95%)';
                (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'hsla(213,100%,90%,0.75)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              Entrar
            </button>
          </Link>
          <Link to="/register">
            <button
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 pl-pulse-ring"
              style={{
                background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
                fontFamily: 'Nunito Sans, sans-serif',
              }}
            >
              Criar Conta
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 pl-animate-fade-up"
            style={{
              background: 'hsla(217,88%,57%,0.15)',
              border: '1px solid hsla(217,88%,57%,0.3)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(162,70%,55%)' }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'hsl(217,90%,78%)', fontFamily: 'Nunito Sans, sans-serif' }}
            >
              IA de Suporte à Decisão Diagnóstica Veterinária
            </span>
          </div>

          {/* Logo */}
          <div
            className="mx-auto mb-8 w-56 md:w-72 pl-animate-fade-up-d1 pl-animate-float rounded-2xl overflow-hidden"
            style={{
              background: 'hsla(0,0%,100%,0.92)',
              padding: '16px 24px',
              boxShadow: '0 20px 60px -12px hsla(221,73%,10%,0.5), 0 0 0 1px hsla(217,88%,57%,0.2)',
            }}
          >
            <img
              src={predictlabLogo}
              alt="PredictLab — IA Veterinária"
              className="w-full object-contain"
            />
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 pl-animate-fade-up-d2"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
          >
            Inteligência Artificial a Serviço do{' '}
            <span className="pl-text-gradient">Diagnóstico Veterinário</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 pl-animate-fade-up-d3"
            style={{ color: 'hsla(213,100%,88%,0.65)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            Otimize seu tempo, aprimore decisões clínicas e gerencie sua clínica com tecnologia de ponta.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pl-animate-fade-up-d4">
            <Link to="/register">
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 80%, hsl(18,76%,50%) 100%)',
                  boxShadow: '0 8px 32px -8px hsla(221,73%,45%,0.6)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                Começar Gratuitamente
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/login">
              <button
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200"
                style={{
                  background: 'hsla(0,0%,100%,0.07)',
                  border: '1px solid hsla(217,88%,57%,0.3)',
                  color: 'hsl(213,100%,90%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.07)')}
              >
                Já tenho conta
              </button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pl-animate-fade-up-d4">
            {[
              { icon: Shield, text: 'Dados protegidos com RLS' },
              { icon: Brain,  text: 'Gemini AI integrado' },
              { icon: Stethoscope, text: 'Para médicos veterinários' },
            ].map(({ icon: I, text }) => (
              <div
                key={text}
                className="flex items-center gap-2"
                style={{ color: 'hsla(213,100%,80%,0.5)', fontFamily: 'Nunito Sans, sans-serif', fontSize: '13px' }}
              >
                <I className="w-3.5 h-3.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating feature badges (desktop only) ── */}
      <FloatingBadge
        icon={FlaskConical}
        label="Análise de Exames"
        sub="Hemograma + Urinálise"
        style={{ top: '28%', left: '4%', animationDelay: '0s' }}
      />
      <FloatingBadge
        icon={Stethoscope}
        label="Consulta SOAP"
        sub="Anamnese guiada por IA"
        style={{ top: '40%', right: '3%', animationDelay: '1.5s' }}
      />
      <FloatingBadge
        icon={Brain}
        label="Gemini AI"
        sub="Diagnóstico inteligente"
        style={{ bottom: '22%', left: '5%', animationDelay: '0.8s' }}
      />

      {/* ── Bottom wave separator ── */}
      <div className="relative z-10">
        <svg
          viewBox="0 0 1440 60"
          className="w-full"
          preserveAspectRatio="none"
          style={{ display: 'block', height: '60px' }}
        >
          <path
            d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
            fill="hsl(213,100%,98%)"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
