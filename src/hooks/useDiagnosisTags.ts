import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractDiagnosisTags } from '@/lib/diagnosisTagExtractor';

export function useDiagnosisTags(patientIds: string[]): Record<string, string[]> {
  const [tagsMap, setTagsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (patientIds.length === 0) {
      setTagsMap({});
      return;
    }

    const fetchTags = async () => {
      const { data, error } = await (supabase as any)
        .from('medical_consultations')
        .select('patient_id, soap_a, created_at')
        .eq('source', 'guided')
        .not('soap_a', 'is', null)
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const result: Record<string, string[]> = {};
      for (const row of data as { patient_id: string; soap_a: string; created_at: string }[]) {
        if (!result[row.patient_id]) {
          result[row.patient_id] = extractDiagnosisTags(row.soap_a);
        }
      }

      setTagsMap(result);
    };

    fetchTags();
  }, [patientIds.join(',')]);

  return tagsMap;
}
