// src/pages/UltrasoundPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  PlusCircle,
  ScanLine,
  Stethoscope,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { usePatient } from '@/contexts/PatientContext';
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
  const { selectedPatient, setSelectedPatient, patients } = usePatient();

  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [speciesError, setSpeciesError] = useState<string | null>(null);

  // ── Fetch full patient data from DB ────────────────────────────────────────

  const loadPatientData = useCallback(async (patientId: string) => {
    setLoading(true);
    setSpeciesError(null);
    setPatient(null);

    const { data, error: dbError } = await supabase
      .from('patients')
      .select('id, name, species, sex, weight, age, owner_name')
      .eq('id', patientId)
      .maybeSingle();

    if (dbError || !data) {
      setSpeciesError('Paciente não encontrado.');
      setLoading(false);
      return;
    }

    const mappedSpecies = SPECIES_MAP[data.species?.toLowerCase() ?? ''];
    if (!mappedSpecies) {
      setSpeciesError(
        `Espécie "${data.species}" não suportada. Apenas cães e gatos são aceitos para laudo ultrassonográfico.`
      );
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
  }, []);

  // Load from URL param (existing /patient/:id/ultrasound flow)
  useEffect(() => {
    if (id) loadPatientData(id);
  }, [id, loadPatientData]);

  // Load from context patient (standalone /ultrasound flow)
  useEffect(() => {
    if (id) return; // URL param takes precedence
    if (selectedPatient) {
      loadPatientData(selectedPatient.id);
    } else {
      setPatient(null);
      setSpeciesError(null);
    }
  }, [selectedPatient, id, loadPatientData]);

  // ── Render ─────────────────────────────────────────────────────────────────

  // When accessed via /patient/:id/ultrasound — keep original minimal layout
  if (id) {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(221,73%,45%)' }} />
        </div>
      );
    }

    if (speciesError || !patient) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="h-12 w-12" style={{ color: 'hsl(352,76%,44%)' }} />
          <p
            className="text-center max-w-sm text-sm"
            style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
          >
            {speciesError ?? 'Erro desconhecido.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'white',
              border: '1px solid hsl(217,50%,85%)',
              color: 'hsl(222,30%,50%)',
              fontFamily: 'Nunito Sans, sans-serif',
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'hsl(217,100%,96%)', color: 'hsl(221,73%,45%)' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
          >
            Novo Laudo Ultrassonográfico
          </h1>
        </div>
        <UltrasoundForm patient={patient} />
      </div>
    );
  }

  // ── Standalone /ultrasound route — full-page layout with patient selector ──

  return (
    <div className="min-h-screen" style={{ background: 'hsl(213,100%,98%)' }}>
      {/* Dark header banner */}
      <div
        className="pl-circuit-bg"
        style={{
          background:
            'linear-gradient(135deg, hsl(222,77%,14%) 0%, hsl(222,77%,20%) 60%, hsl(221,73%,24%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
          boxShadow: '0 2px 20px -4px hsla(221,73%,10%,0.6)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="pl-animate-fade-up flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'hsla(0,0%,100%,0.08)',
                border: '1px solid hsla(217,88%,57%,0.25)',
              }}
            >
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
              >
                Novo Laudo Ultrassonográfico
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  color: 'hsla(213,100%,85%,0.55)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                Geração de laudo estruturado com inteligência artificial
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Patient selector card */}
        <div
          className="rounded-2xl overflow-hidden pl-animate-fade-up-d1"
          style={{
            background: 'white',
            border: '1px solid hsl(217,50%,90%)',
            boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
          }}
        >
          <div className="h-1" style={{ background: 'hsl(221,73%,45%)' }} />
          <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            {selectedPatient ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'hsla(221,73%,45%,0.08)' }}
                  >
                    {loading ? (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        style={{ color: 'hsl(221,73%,45%)' }}
                      />
                    ) : (
                      <Stethoscope
                        className="w-4 h-4"
                        style={{ color: 'hsl(221,73%,45%)' }}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{
                        fontFamily: 'Nunito Sans, sans-serif',
                        color: 'hsl(222,77%,15%)',
                      }}
                    >
                      {selectedPatient.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: 'hsl(222,30%,55%)',
                        fontFamily: 'Nunito Sans, sans-serif',
                      }}
                    >
                      {[
                        selectedPatient.species,
                        selectedPatient.breed,
                        selectedPatient.owner_name && `Tutor: ${selectedPatient.owner_name}`,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs font-medium transition-all"
                  style={{
                    color: 'hsl(222,30%,55%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                  }}
                >
                  Alterar paciente
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full flex-wrap">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: 'hsl(222,30%,50%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Selecione o paciente
                </p>
                <Select
                  onValueChange={(patientId) => {
                    const p = patients.find((pt) => pt.id === patientId);
                    if (p) setSelectedPatient(p);
                  }}
                >
                  <SelectTrigger
                    className="h-10 rounded-xl text-sm flex-1 min-w-[200px]"
                    style={{
                      borderColor: 'hsl(217,50%,85%)',
                      fontFamily: 'Nunito Sans, sans-serif',
                    }}
                  >
                    <SelectValue placeholder="Selecionar paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.species ? ` (${p.species})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link
                  to="/register-pet"
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-all"
                  style={{
                    color: 'hsl(221,73%,45%)',
                    fontFamily: 'Nunito Sans, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Cadastrar pet
                </Link>
              </div>
            )}
          </div>

          {/* Species error — shown inline so user can change patient */}
          {speciesError && selectedPatient && (
            <div
              className="mx-5 mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
              style={{
                background: 'hsl(352,100%,97%)',
                border: '1px solid hsl(352,76%,88%)',
              }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(352,76%,44%)' }} />
              <p
                className="text-xs"
                style={{ color: 'hsl(352,76%,35%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                {speciesError}
              </p>
            </div>
          )}
        </div>

        {/* Content area */}
        {loading && selectedPatient && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(221,73%,45%)' }} />
          </div>
        )}

        {!loading && patient && <UltrasoundForm patient={patient} />}

        {!loading && !patient && !speciesError && (
          <div
            className="rounded-2xl overflow-hidden pl-animate-fade-up-d2"
            style={{
              background: 'white',
              border: '1px solid hsl(217,50%,90%)',
              boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
            }}
          >
            <div
              className="h-1"
              style={{
                background:
                  'linear-gradient(135deg, hsl(221,73%,45%) 0%, hsl(217,88%,57%) 80%, hsl(18,76%,50%) 100%)',
              }}
            />
            <div className="py-14 flex flex-col items-center gap-3">
              <ScanLine className="w-10 h-10" style={{ color: 'hsl(221,73%,75%)' }} />
              <p
                className="text-sm"
                style={{
                  color: 'hsl(222,30%,60%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                Selecione um paciente acima para iniciar o laudo
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltrasoundPage;
