import type { DriveStep } from 'driver.js'

export const tourSteps: DriveStep[] = [
  {
    element: '[data-tour="nav-register-pet"]',
    popover: {
      title: 'Cadastre seu primeiro paciente',
      description: 'Comece adicionando o paciente com os dados do tutor, espécie e raça.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-chat"]',
    popover: {
      title: 'Prontuário inteligente e auditável',
      description: 'Selecione a queixa, responda as perguntas clínicas e a IA estrutura o SOAP automaticamente.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-exams"]',
    popover: {
      title: 'Anexe o PDF do laboratório',
      description: 'Arraste o laudo aqui. O PredictVet extrai a data e o laboratório automaticamente.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: 'Acompanhe a linha de tendência',
      description: 'Com 2 ou mais exames, o PredictVet desenha a evolução de cada parâmetro e destaca o que mudou.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-ultrasound"]',
    popover: {
      title: 'Laudo ultrassonográfico guiado',
      description: 'Preencha o laudo por órgão com texto ou voz. O sistema gera o texto clínico completo automaticamente.',
      side: 'bottom',
      align: 'start',
    },
  },
]
