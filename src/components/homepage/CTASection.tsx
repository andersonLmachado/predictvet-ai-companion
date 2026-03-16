import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section
      className="py-20 px-6 md:px-12 pl-circuit-bg"
      style={{
        background: 'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)',
        borderTop: '1px solid hsla(217,88%,57%,0.15)',
      }}
    >
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
        >
          Entre para a lista de espera
        </h2>
        <p
          className="text-lg"
          style={{ color: 'hsla(213,100%,88%,0.65)', fontFamily: 'Nunito Sans, sans-serif' }}
        >
          O PredictLab está em fase de desenvolvimento, em breve mais novidades vão surgir.
        </p>
        <Link to="/register">
          <button
            className="mt-4 inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-base text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 100%)',
              boxShadow: '0 6px 24px -6px hsla(221,73%,45%,0.5)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            Lista de Espera
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
