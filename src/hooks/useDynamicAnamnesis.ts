import { useState, useEffect, useRef } from 'react';
import type { FollowUpAnswer } from '@/lib/anamnesisApi';
import { parseOpenAICategories, VALID_CATEGORIES } from '@/lib/openaiCategories';
import { fetchSupabaseQuestions, type PerguntaAnamnese } from '@/hooks/useSupabaseQuestions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DynamicPhase = 'loading' | 'questions' | 'submitting' | 'done';

export interface UseDynamicAnamnesisResult {
  phase: DynamicPhase;
  questions: PerguntaAnamnese[];
  currentIndex: number;
  respondAnswer: (response: string) => void;
  skip: () => void;
}

// ─── Core async logic (exported for testing) ──────────────────────────────────

export async function initDynamicPhase(params: {
  transcription: string;
  onFinish: (answers: FollowUpAnswer[]) => void;
  onQuestionsLoaded: (questions: PerguntaAnamnese[]) => void;
  /** Optional override for testing — defaults to import.meta.env.VITE_OPENAI_API_KEY */
  apiKey?: string;
}): Promise<void> {
  const { transcription, onFinish, onQuestionsLoaded } = params;
  const apiKey = params.apiKey ?? import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.log('[onFinish] motivo: VITE_OPENAI_API_KEY ausente');
    onFinish([]);
    return;
  }

  // 1. Call OpenAI to identify clinical categories
  let categories: string[];
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 100,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente veterinário clínico.',
          },
          {
            role: 'user',
            content:
              `Dado o relato do tutor: "${transcription}"\n\n` +
              `Identifique quais das seguintes categorias clínicas são relevantes:\n` +
              `${VALID_CATEGORIES.join(', ')}\n\n` +
              `Responda APENAS com array JSON puro, sem markdown, sem explicações. ` +
              `Exemplo: ["Categoria A", "Categoria B"]`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.log('[onFinish] motivo: OpenAI respondeu HTTP', response.status);
      onFinish([]);
      return;
    }

    const data = await response.json();
    const rawContent: string = data?.choices?.[0]?.message?.content ?? '';
    categories = parseOpenAICategories(rawContent);
    console.log('[DynamicAnamnesis] raw response:', rawContent);
    console.log('[DynamicAnamnesis] categories:', categories);
  } catch (err) {
    console.log('[onFinish] motivo: exceção na chamada OpenAI', err);
    onFinish([]);
    return;
  }

  if (categories.length === 0) {
    console.log('[onFinish] motivo: categories vazio após parse');
    onFinish([]);
    return;
  }

  // 2. Fetch questions from Supabase
  const { questions, error } = await fetchSupabaseQuestions(categories);
  console.log('[DynamicAnamnesis] questions:', questions);

  if (error || questions.length === 0) {
    console.log('[onFinish] motivo: Supabase retornou vazio ou erro', error);
    onFinish([]);
    return;
  }

  onQuestionsLoaded(questions);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDynamicAnamnesis(
  transcription: string,
  onFinish: (answers: FollowUpAnswer[]) => void
): UseDynamicAnamnesisResult {
  const [phase, setPhase] = useState<DynamicPhase>('loading');
  const [questions, setQuestions] = useState<PerguntaAnamnese[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const answersRef = useRef<FollowUpAnswer[]>([]);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    console.log('[mount] transcription:', transcription?.length, transcription?.slice(0, 50));
    initDynamicPhase({
      transcription,
      onFinish: (answers) => onFinishRef.current(answers),
      onQuestionsLoaded: (qs) => {
        setQuestions(qs);
        setPhase('questions');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = (answer?: string) => {
    if (answer) {
      answersRef.current = [
        ...answersRef.current,
        {
          question: questions[currentIndex].pergunta,
          answer: answer.slice(0, 300),
        },
      ];
    }
    if (currentIndex + 1 >= questions.length) {
      setPhase('submitting');
      onFinishRef.current(answersRef.current);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return {
    phase,
    questions,
    currentIndex,
    respondAnswer: (response) => advance(response),
    skip: () => advance(),
  };
}
