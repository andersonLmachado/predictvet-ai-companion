import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Dra. Marina Silva',
      role: 'Clínica Pet Care',
      content: 'O PredictLab revolucionou minha prática clínica. A IA me ajuda a considerar diagnósticos que passariam despercebidos.',
    },
    {
      name: 'Dr. Carlos Mendes',
      role: 'Especialista em Felinos',
      content: 'Interface intuitiva e sugestões realmente úteis. Reduzi o tempo de consulta mantendo a qualidade.',
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          O Que Dizem Nossos Usuários
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="border border-border/60 bg-card shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary/80 text-primary/80" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.content}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
