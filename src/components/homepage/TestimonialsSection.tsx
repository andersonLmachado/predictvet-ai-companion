
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Dr. Marina Silva",
      role: "Médica Veterinária - Clínica Pet Care",
      content: "O PredictVet revolucionou minha prática clínica. A IA me ajuda a considerar diagnósticos que às vezes passariam despercebidos, e a gestão de pacientes ficou muito mais organizada.",
      rating: 5
    },
    {
      name: "Dr. Carlos Mendes",
      role: "Veterinário Especialista em Felinos",
      content: "Excelente ferramenta! A interface é intuitiva e as sugestões da IA são realmente úteis. Consegui reduzir significativamente o tempo de consulta mantendo a qualidade do atendimento.",
      rating: 5
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            O Que Nossos Usuários Dizem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça as experiências de veterinários que já transformaram sua prática com o PredictVet
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <blockquote className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </blockquote>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-vet-blue-600 to-vet-green-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
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
