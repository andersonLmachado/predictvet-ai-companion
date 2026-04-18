import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    id: 'q1',
    question: 'O Predict AI substitui o diagnóstico do Médico Veterinário?',
    answer:
      'Não. O Predict AI é uma ferramenta de suporte à decisão. Ele atua como um "segundo par de olhos" altamente treinado, processando milhares de correlações estatísticas em segundos para oferecer insights. A palavra final, a responsabilidade técnica e o julgamento clínico cabem sempre ao Médico Veterinário.',
  },
  {
    id: 'q2',
    question: 'O que é o motor PredictVet e como ele foi treinado?',
    answer:
      'O PredictVet é nossa tecnologia proprietária de inteligência artificial. Ele foi treinado com milhares de bases de dados clínicos e laboratoriais, utilizando modelos de aprendizado de máquina (Machine Learning) para identificar padrões não lineares entre biomarcadores hematológicos, bioquímicos e sinais clínicos que costumam passar despercebidos na análise humana isolada.',
  },
  {
    id: 'q3',
    question: 'O sistema é compatível com o meu equipamento laboratorial?',
    answer:
      'Sim. O Predict AI é uma plataforma agnóstica. Isso significa que ele consegue ler e processar arquivos gerados por qualquer fabricante de hardware (Mindray, Dymind, Idexx, etc.) através de protocolos de integração como HL7, XML ou upload direto de laudos digitais.',
  },
  {
    id: 'q4',
    question: 'Como a plataforma ajuda a aumentar o faturamento da minha clínica?',
    answer:
      'O sistema gera um Laudo Visual Preditivo que materializa o risco clínico para o tutor de forma didática (estilo semáforo). Ao ver o risco detectado pela IA, a adesão do tutor a exames complementares (como ultrassom, ecocardio ou SDMA) e tratamentos preventivos aumenta drasticamente, elevando o ticket médio da sua consulta.',
  },
  {
    id: 'q5',
    question: 'Meus dados e os dados dos meus pacientes estão seguros?',
    answer:
      'Absolutamente. Seguimos rigorosamente os protocolos da LGPD (Lei Geral de Proteção de Dados). Todas as informações são criptografadas e armazenadas em servidores de alta segurança. Você detém a posse dos seus dados e pode exportá-los sempre que desejar.',
  },
  {
    id: 'q6',
    question: 'Preciso instalar algum software pesado no meu computador?',
    answer:
      'Não. O Predict AI é uma solução SaaS (Software as a Service) baseada na nuvem. Você pode acessá-lo de qualquer navegador, tablet ou smartphone com internet, sem a necessidade de instalações complexas.',
  },
  {
    id: 'q7',
    question: 'Como posso começar a utilizar o Predict AI?',
    answer: (
      <>
        Atualmente, estamos operando em fase de Beta Restrito. Você pode se inscrever em nossa{' '}
        <span
          style={{
            color: 'hsl(221,73%,45%)',
            fontWeight: 600,
          }}
        >
          Lista de Espera
        </span>{' '}
        para ser um dos primeiros a testar a tecnologia e receber condições exclusivas de lançamento.
      </>
    ),
  },
  {
    id: 'q8',
    question: 'O Tutor/Responsável pelo Pet terá essas informações?',
    answer:
      'O PredictVet é um Ecossistema que permite uma comunicação rápida, segura e direta de como está a saúde do seu Pet.',
  },
];

const FAQSection = () => {
  return (
    <section
      className="py-24 px-6 md:px-12"
      style={{ background: 'hsl(213,100%,98%)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-12 gap-3">
          <span
            className="text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{
              background: 'hsl(217,100%,95%)',
              color: 'hsl(221,73%,45%)',
              border: '1px solid hsl(217,88%,85%)',
              fontFamily: 'Nunito Sans, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            FAQ
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
          >
            Perguntas Frequentes
          </h2>
          <p
            className="text-base"
            style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
          >
            Tudo o que você precisa saber sobre o PredictVet
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="rounded-2xl overflow-hidden border-0 pl-faq-item"
              style={{
                background: 'white',
                border: '1px solid hsl(217,50%,88%)',
                boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
              }}
            >
              <AccordionTrigger
                className="px-6 py-5 hover:no-underline text-left"
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'hsl(222,77%,15%)',
                }}
              >
                {faq.question}
              </AccordionTrigger>
              <AccordionContent
                className="px-6 pb-5"
                style={{
                  fontFamily: 'Nunito Sans, sans-serif',
                  fontSize: '0.875rem',
                  lineHeight: '1.7',
                  color: 'hsl(222,30%,55%)',
                }}
              >
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
