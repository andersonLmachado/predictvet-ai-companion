// src/pages/UltrasoundPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { UltrasoundSex, UltrasoundSpecies } from '@/types/ultrasound';
import UltrasoundForm from '@/components/ultrasound/UltrasoundForm';

// ── Species mapping ──────────────────────────────────────────────────────────

const SPECIES_MAP: Record<string, UltrasoundSpecies> = {
  canina: 'canis',
  felina: 'felis',
};

// ── Sex pre-fill mapping ─────────────────────────────────────────────────────

const SEX_MAP: Record<string, UltrasoundSex> = {
  macho: 'male',
  femea: 'female',
};

// ── Age parsing ──────────────────────────────────────────────────────────────

export function parseAgeYears(age: string | null): number | null {
  if (!age) return null;
  const match = age.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(',', '.'));
  if (isNaN(num)) return null;
  const isMeses = /mes(es)?/i.test(age);
  return isMeses ? num / 12 : num;
}

// ── Page component ───────────────────────────────────────────────────────────

const UltrasoundPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('patients')
        .select('id, name, species, sex, weight, age, owner_name')
        .eq('id', id)
        .maybeSingle();

      if (dbError || !data) {
        setError('Paciente não encontrado.');
        setLoading(false);
        return;
      }

      const mappedSpecies = SPECIES_MAP[data.species?.toLowerCase() ?? ''];
      if (!mappedSpecies) {
        setError(`Espécie "${data.species}" não suportada para laudo ultrassonográfico.`);
        setLoading(false);
        return;
      }

      setPatient({
        id: data.id,
        name: data.name ?? '',
        species: mappedSpecies,
        owner_name: data.owner_name ?? '',
        age: data.age ?? null,
        weight: data.weight ?? null,
        initialSex: SEX_MAP[data.sex?.toLowerCase() ?? ''] ?? '',
        ageYears: parseAgeYears(data.age),
      });
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground text-center max-w-sm">{error ?? 'Erro desconhecido.'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
          Novo Laudo Ultrassonográfico
        </h1>
      </div>
      <UltrasoundForm patient={patient} />
    </div>
  );
};

export default UltrasoundPage;
