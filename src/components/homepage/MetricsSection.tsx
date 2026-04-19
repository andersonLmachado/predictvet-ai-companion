import React from 'react';

const metrics = [
  { value: '2.000+', label: 'perguntas clínicas' },
  { value: '22', label: 'categorias clínicas' },
  { value: '100%', label: 'dados seguros' },
] as const;

const MetricsSection = () => {
  return (
    <section
      className="py-20 px-6 md:px-12"
      style={{ background: 'hsl(213,100%,98%)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map(({ value, label }) => (
            <div
              key={label}
              className="text-center p-8 rounded-2xl"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,90%)',
                boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
              }}
            >
              <div
                className="text-4xl font-bold mb-2"
                style={{
                  fontFamily: 'Sora, sans-serif',
                  color: 'hsl(221,73%,45%)',
                }}
              >
                {value}
              </div>
              <div
                className="text-sm"
                style={{
                  fontFamily: 'Nunito Sans, sans-serif',
                  color: 'hsl(222,30%,55%)',
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
