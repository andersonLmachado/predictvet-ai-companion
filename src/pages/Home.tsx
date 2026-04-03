import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTour } from '@/hooks/useTour';
import { hasTourBeenCompleted } from '@/lib/onboardingTour';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PawPrint,
  FlaskConical,
  Stethoscope,
  UserPlus,
  ClipboardList,
  FileText,
  TrendingUp,
  ArrowRight,
  Activity,
  Sparkles,
  ScanLine,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const SPECIES_COLORS = [
  'hsl(221, 73%, 52%)',
  'hsl(217, 90%, 65%)',
  'hsl(352, 76%, 52%)',
  'hsl(18, 76%, 55%)',
  'hsl(199, 85%, 48%)',
];

interface PatientRow {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  owner_name: string;
  updated_at: string;
}

/* ── Reusable KPI Card ── */
function KpiCard({
  label,
  value,
  icon: Icon,
  accentColor,
  loading,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  loading: boolean;
  delay: string;
}) {
  return (
    <div
      className={`pl-card-hover rounded-2xl overflow-hidden pl-animate-fade-up-d${delay}`}
      style={{
        background: 'white',
        border: '1px solid hsl(217,50%,90%)',
        boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
      }}
    >
      {/* Colored top stripe */}
      <div className="h-1 w-full" style={{ background: accentColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-1" />
            ) : (
              <p
                className="text-3xl font-bold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
              >
                {value}
              </p>
            )}
            <p className="text-xs font-medium mt-0.5" style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}>
              {label}
            </p>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Action Card ── */
function ActionCard({
  label,
  icon: Icon,
  description,
  path,
  gradient,
}: {
  label: string;
  icon: React.ElementType;
  description: string;
  path: string;
  gradient: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200 group pl-card-hover"
      style={{
        background: 'white',
        border: '1px solid hsl(217,50%,90%)',
        boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}>
            {label}
          </p>
          <p className="text-xs truncate" style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}>
            {description}
          </p>
        </div>
        <ArrowRight
          className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1"
          style={{ color: 'hsl(221,73%,60%)' }}
        />
      </div>
    </button>
  );
}

/* ── Custom Tooltip for Chart ── */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-sm"
        style={{
          background: 'hsl(222,77%,14%)',
          border: '1px solid hsla(217,88%,57%,0.25)',
          color: 'hsl(213,100%,92%)',
          fontFamily: 'Nunito Sans, sans-serif',
          boxShadow: '0 8px 24px -4px hsla(221,73%,10%,0.4)',
        }}
      >
        <strong style={{ fontFamily: 'Sora, sans-serif' }}>{payload[0].name}</strong>
        <span className="ml-2">{payload[0].value} paciente{payload[0].value !== 1 ? 's' : ''}</span>
      </div>
    );
  }
  return null;
};

/* ── Main Home Component ── */
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startTour } = useTour();
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalExams, setTotalExams] = useState(0);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [newPatientsMonth, setNewPatientsMonth] = useState(0);
  const [speciesData, setSpeciesData] = useState<{ name: string; value: number }[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    if (!hasTourBeenCompleted()) {
      const timer = setTimeout(startTour, 800);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const doctorName = (() => {
    const full = user?.user_metadata?.full_name as string | undefined;
    if (full) return `Dr(a). ${full.split(' ')[0]}`;
    return 'Doutor(a)';
  })();

  useEffect(() => {
    if (!user?.id) return;

    const fetchAll = async () => {
      setLoading(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [patientsRes, examsRes, consultRes, newPatsRes, speciesRes, recentRes] =
        await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }).eq('veterinarian_id', user.id),
          supabase.from('exams_history').select('id, patients!fk_patient!inner(veterinarian_id)', { count: 'exact', head: true }).eq('patients.veterinarian_id', user.id),
          supabase.from('medical_consultations').select('id', { count: 'exact', head: true }).eq('veterinarian_id', user.id),
          supabase.from('patients').select('id', { count: 'exact', head: true }).eq('veterinarian_id', user.id).gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('patients').select('species').eq('veterinarian_id', user.id),
          supabase.from('patients').select('id, name, species, breed, owner_name, updated_at').eq('veterinarian_id', user.id).order('updated_at', { ascending: false }).limit(5),
        ]);

      setTotalPatients(patientsRes.count ?? 0);
      setTotalExams(examsRes.count ?? 0);
      setTotalConsultations(consultRes.count ?? 0);
      setNewPatientsMonth(newPatsRes.count ?? 0);

      if (speciesRes.data) {
        const counts: Record<string, number> = {};
        speciesRes.data.forEach((p: any) => {
          const sp = (p.species || 'Outro').trim();
          counts[sp] = (counts[sp] || 0) + 1;
        });
        setSpeciesData(
          Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
        );
      }

      if (recentRes.data) setRecentPatients(recentRes.data as PatientRow[]);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const kpis = [
    { label: 'Total de Pacientes',    value: totalPatients,     icon: PawPrint,     accentColor: 'hsl(221,73%,45%)', delay: '1' },
    { label: 'Exames Analisados',     value: totalExams,        icon: FlaskConical,  accentColor: 'hsl(162,70%,38%)', delay: '2' },
    { label: 'Consultas SOAP',        value: totalConsultations, icon: Stethoscope, accentColor: 'hsl(38,88%,48%)',  delay: '3' },
    { label: 'Novos Pacientes (Mês)', value: newPatientsMonth,  icon: TrendingUp,   accentColor: 'hsl(352,76%,44%)', delay: '4' },
  ];

  const quickActions = [
    {
      label: 'Novo Cadastro',
      icon: UserPlus,
      description: 'Cadastrar novo pet e tutor',
      path: '/register-pet',
      gradient: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(221,73%,55%))',
    },
    {
      label: 'Nova Consulta',
      icon: ClipboardList,
      description: 'Anamnese guiada com SOAP',
      path: '/chat',
      gradient: 'linear-gradient(135deg, hsl(162,70%,35%), hsl(162,70%,45%))',
    },
    {
      label: 'Analisar Exame',
      icon: FileText,
      description: 'Upload e interpretação por IA',
      path: '/exams',
      gradient: 'linear-gradient(135deg, hsl(352,76%,40%), hsl(18,76%,50%))',
    },
    {
      label: 'Laudo US',
      icon: ScanLine,
      description: 'Laudo ultrassonográfico por IA',
      path: '/ultrasound',
      gradient: 'linear-gradient(135deg, hsl(199,85%,38%), hsl(217,88%,57%))',
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(213,100%,98%)' }}
    >
      {/* ── Header Banner ── */}
      <div
        className="pl-circuit-bg"
        style={{
          background: 'linear-gradient(135deg, hsl(222,77%,14%) 0%, hsl(222,77%,20%) 60%, hsl(221,73%,24%) 100%)',
          borderBottom: '1px solid hsla(217,88%,57%,0.15)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="pl-animate-fade-up">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(18,76%,60%)' }} />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'hsla(213,100%,85%,0.6)', fontFamily: 'Nunito Sans, sans-serif' }}
                >
                  Painel Principal
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(213,100%,97%)' }}
              >
                {greeting},{' '}
                <span style={{ color: 'hsl(217,90%,72%)' }}>{doctorName}</span>
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: 'hsla(213,100%,85%,0.55)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Visão geral da sua clínica veterinária
              </p>
            </div>

            <div
              className="pl-animate-fade-up-d2 flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(217,88%,57%,0.2)' }}
            >
              <Activity className="w-4 h-4" style={{ color: 'hsl(162,70%,55%)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'hsl(213,100%,90%)', fontFamily: 'Nunito Sans, sans-serif' }}
              >
                Sistema operacional
              </span>
              <span
                className="w-2 h-2 rounded-full pl-pulse-ring"
                style={{ background: 'hsl(162,70%,50%)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} loading={loading} />
          ))}
        </div>

        {/* Chart + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Species Distribution Chart */}
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              border: '1px solid hsl(217,50%,90%)',
              boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
            }}
          >
            <div
              className="px-6 py-4 border-b flex items-center gap-2"
              style={{ borderColor: 'hsl(217,50%,93%)' }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(352,76%,44%))' }}
              />
              <h2
                className="text-sm font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
              >
                Distribuição por Espécie
              </h2>
            </div>
            <div className="p-4">
              {loading ? (
                <Skeleton className="h-[260px] w-full rounded-xl" />
              ) : speciesData.length === 0 ? (
                <div className="h-[260px] flex flex-col items-center justify-center gap-3">
                  <PawPrint className="w-10 h-10" style={{ color: 'hsl(221,73%,75%)' }} />
                  <p className="text-sm" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                    Nenhum paciente cadastrado ainda
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={speciesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {speciesData.map((_, i) => (
                        <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif', fontSize: '12px' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              border: '1px solid hsl(217,50%,90%)',
              boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
            }}
          >
            <div
              className="px-6 py-4 border-b flex items-center gap-2"
              style={{ borderColor: 'hsl(217,50%,93%)' }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(18,76%,50%))' }}
              />
              <h2
                className="text-sm font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
              >
                Acesso Rápido
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {quickActions.map((action) => (
                <ActionCard key={action.label} {...action} />
              ))}

              {/* Divider + Dashboard link */}
              <div className="pt-2 border-t" style={{ borderColor: 'hsl(217,50%,93%)' }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group"
                  style={{ color: 'hsl(221,73%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'hsl(217,100%,96%)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>Ver Dashboard Completo</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'white',
            border: '1px solid hsl(217,50%,90%)',
            boxShadow: '0 2px 12px -4px hsla(221,73%,30%,0.1)',
          }}
        >
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'hsl(217,50%,93%)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(162,70%,38%))' }}
              />
              <h2
                className="text-sm font-semibold"
                style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
              >
                Pacientes Recentes
              </h2>
            </div>
            <button
              onClick={() => navigate('/patients')}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'hsl(221,73%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'hsl(217,100%,96%)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: 'hsl(217,50%,93%)' }}>
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="py-14 flex flex-col items-center gap-3">
                <PawPrint className="w-10 h-10" style={{ color: 'hsl(221,73%,75%)' }} />
                <p className="text-sm" style={{ color: 'hsl(222,30%,60%)', fontFamily: 'Nunito Sans, sans-serif' }}>
                  Nenhum paciente cadastrado ainda
                </p>
                <button
                  onClick={() => navigate('/register-pet')}
                  className="mt-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))' }}
                >
                  Cadastrar primeiro paciente
                </button>
              </div>
            ) : (
              recentPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/patient/${p.id}`)}
                  className="flex items-center justify-between px-6 py-4 cursor-pointer transition-colors group"
                  onMouseEnter={e => (e.currentTarget.style.background = 'hsl(213,100%,98%)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(221,73%,45%), hsl(217,88%,57%))' }}
                    >
                      <PawPrint className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'Sora, sans-serif', color: 'hsl(222,77%,15%)' }}
                      >
                        {p.name}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'hsl(222,30%,55%)', fontFamily: 'Nunito Sans, sans-serif' }}
                      >
                        {p.species}
                        {p.breed ? ` · ${p.breed}` : ''} — {p.owner_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{
                        background: 'hsl(217,100%,95%)',
                        color: 'hsl(221,73%,45%)',
                        fontFamily: 'Nunito Sans, sans-serif',
                      }}
                    >
                      {p.species}
                    </span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      style={{ color: 'hsl(221,73%,65%)' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
