import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerguntaAnamnese {
  id: number;
  agrupamento: string;
  pergunta: string;
  ativo: boolean;
}

export interface UseSupabaseQuestionsResult {
  questions: PerguntaAnamnese[];
  loading: boolean;
  error: Error | null;
}

// ─── Fetcher (exported for testing) ──────────────────────────────────────────

export async function fetchSupabaseQuestions(categories: string[]): Promise<{
  questions: PerguntaAnamnese[];
  error: Error | null;
}> {
  if (categories.length === 0) {
    return { questions: [], error: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('perguntas_anamnese')
    .select('id, agrupamento, pergunta, ativo')
    .in('agrupamento', categories)
    .eq('ativo', true)
    .order('agrupamento', { ascending: true })
    .order('id', { ascending: true })
    .limit(8);

  if (error) {
    return { questions: [], error: new Error(error.message) };
  }

  return { questions: (data ?? []) as PerguntaAnamnese[], error: null };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSupabaseQuestions(categories: string[]): UseSupabaseQuestionsResult {
  const [state, setState] = useState<UseSupabaseQuestionsResult>({
    questions: [],
    loading: categories.length > 0,
    error: null,
  });

  useEffect(() => {
    if (categories.length === 0) {
      setState({ questions: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    fetchSupabaseQuestions(categories).then(({ questions, error }) => {
      setState({ questions, loading: false, error });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(categories)]);

  return state;
}
