import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardList, Mic, PlusCircle, Stethoscope } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePatient } from '@/contexts/PatientContext';

const ConsultationModeSelectorPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { selectedPatient, setSelectedPatient, patients, patientsLoaded } = usePatient();
  const navigate = useNavigate();

  // Pré-seleciona paciente a partir da URL
  useEffect(() => {
    if (!patientId || !patientsLoaded) return;
    const match = patients.find((p) => p.id === patientId);
    if (match) setSelectedPatient(match);
  }, [patientId, patientsLoaded, patients, setSelectedPatient]);

  const canSelect = Boolean(selectedPatient);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(213,100%,98%)' }}>
      {/* ── Dark header ──────────────────────────────────────────────────── */}
      <div
        className="pl-circuit-bg"
        style={{
          background:
            'linear-gradient(135deg, hsl(222,77%,12%) 0%, hsl(222,77%,18%) 60%, hsl(221,73%,22%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
          boxShadow: '0 2px 20px -4px hsla(221,73%,10%,0.6)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: 'hsla(0,0%,100%,0.08)',
                border: '1px solid hsla(217,88%,57%,0.25)',
              }}
            >
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
              >
                Nova Consulta
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  color: 'hsla(213,100%,85%,0.55)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                Escolha como registrar a consulta
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Seletor de paciente ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
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
                    <Stethoscope className="w-4 h-4" style={{ color: 'hsl(221,73%,45%)' }} />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,77%,15%)' }}
                    >
                      {selectedPatient.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
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
                  style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
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
                  onValueChange={(id) => {
                    const p = patients.find((pt) => pt.id === id);
                    if (p) setSelectedPatient(p);
                  }}
                >
                  <SelectTrigger
                    className="h-10 rounded-xl text-sm flex-1 min-w-[200px]"
                    style={{ borderColor: 'hsl(217,50%,85%)', fontFamily: 'Nunito Sans, sans-serif' }}
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
        </div>

        {/* ── Cards de modo ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card — Registro por Voz */}
          <button
            disabled={!canSelect}
            onClick={() => canSelect && navigate(`/consultation/${selectedPatient!.id}/voice`)}
            className="rounded-2xl overflow-hidden text-left transition-all pl-card-hover pl-animate-fade-up"
            style={{
              background: 'white',
              border: `1px solid ${canSelect ? 'hsl(352,76%,85%)' : 'hsl(217,50%,90%)'}`,
              boxShadow: '0 2px 12px -4px hsla(352,76%,30%,0.08)',
              opacity: canSelect ? 1 : 0.5,
              cursor: canSelect ? 'pointer' : 'not-allowed',
            }}
          >
            <div
              className="h-1.5"
              style={{
                background:
                  'linear-gradient(135deg, hsl(352,76%,44%), hsl(18,76%,50%))',
              }}
            />
            <div className="p-5 space-y-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'hsla(352,76%,44%,0.08)' }}
              >
                <Mic className="w-5 h-5" style={{ color: 'hsl(352,76%,44%)' }} />
              </div>
              <div>
                <p
                  className="text-base font-bold"
                  style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
                >
                  🎙 Registro por Voz
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
                >
                  Grave a consulta agora ou depois — a IA estrutura o SOAP do áudio
                </p>
              </div>
            </div>
          </button>

          {/* Card — Consulta Guiada */}
          <button
            disabled={!canSelect}
            onClick={() => canSelect && navigate(`/anamnese-guiada/${selectedPatient!.id}`)}
            className="rounded-2xl overflow-hidden text-left transition-all pl-card-hover pl-animate-fade-up"
            style={{
              background: 'white',
              border: `1px solid ${canSelect ? 'hsl(221,73%,85%)' : 'hsl(217,50%,90%)'}`,
              boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
              opacity: canSelect ? 1 : 0.5,
              cursor: canSelect ? 'pointer' : 'not-allowed',
            }}
          >
            <div
              className="h-1.5"
              style={{
                background:
                  'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))',
              }}
            />
            <div className="p-5 space-y-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'hsla(221,73%,45%,0.08)' }}
              >
                <ClipboardList className="w-5 h-5" style={{ color: 'hsl(221,73%,45%)' }} />
              </div>
              <div>
                <p
                  className="text-base font-bold"
                  style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
                >
                  ✦ Consulta Guiada
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,55%)' }}
                >
                  Perguntas clínicas estruturadas — SOAP mais preciso e auditável
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationModeSelectorPage;
