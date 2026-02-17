import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Home as HomeIcon,
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
  'hsl(215, 100%, 50%)',   // primary blue
  'hsl(160, 60%, 45%)',    // teal
  'hsl(35, 90%, 55%)',     // amber
  'hsl(280, 60%, 55%)',    // purple
  'hsl(0, 70%, 55%)',      // red
];

interface PatientRow {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  owner_name: string;
  updated_at: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalExams, setTotalExams] = useState(0);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [newPatientsMonth, setNewPatientsMonth] = useState(0);
  const [speciesData, setSpeciesData] = useState<{ name: string; value: number }[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [patientsRes, examsRes, consultRes, newPatsRes, speciesRes, recentRes] =
        await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('exams_history').select('id', { count: 'exact', head: true }),
          supabase.from('medical_consultations').select('id', { count: 'exact', head: true }),
          supabase
            .from('patients')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('patients').select('species'),
          supabase
            .from('patients')
            .select('id, name, species, breed, owner_name, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5),
        ]);

      setTotalPatients(patientsRes.count ?? 0);
      setTotalExams(examsRes.count ?? 0);
      setTotalConsultations(consultRes.count ?? 0);
      setNewPatientsMonth(newPatsRes.count ?? 0);

      // Species breakdown
      if (speciesRes.data) {
        const counts: Record<string, number> = {};
        speciesRes.data.forEach((p: any) => {
          const sp = (p.species || 'Outro').trim();
          counts[sp] = (counts[sp] || 0) + 1;
        });
        setSpeciesData(
          Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
        );
      }

      if (recentRes.data) {
        setRecentPatients(recentRes.data as PatientRow[]);
      }

      setLoading(false);
    };

    fetchAll();
  }, []);

  const kpis = [
    {
      label: 'Total de Pacientes',
      value: totalPatients,
      icon: PawPrint,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Exames Analisados',
      value: totalExams,
      icon: FlaskConical,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Consultas SOAP',
      value: totalConsultations,
      icon: Stethoscope,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Novos Pacientes (Mês)',
      value: newPatientsMonth,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  const quickActions = [
    { label: 'Novo Cadastro', icon: UserPlus, path: '/register-pet' },
    { label: 'Nova Consulta', icon: ClipboardList, path: '/chat' },
    { label: 'Analisar Exame', icon: FileText, path: '/exams' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HomeIcon className="h-6 w-6 text-primary" />
          Painel Principal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral da sua clínica veterinária
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${kpi.bg}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle row: chart + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Species Chart */}
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribuição por Espécie</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full rounded-lg" />
            ) : speciesData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-16">Nenhum paciente cadastrado</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={speciesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {speciesData.map((_, i) => (
                      <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="justify-start gap-3 h-12 text-sm font-medium"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-5 w-5 text-primary" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent patients */}
      <Card className="shadow-md border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Pacientes Recentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/patients')}>
            Ver todos <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum paciente cadastrado</p>
          ) : (
            <div className="divide-y divide-border">
              {recentPatients.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/40 rounded-lg px-2 -mx-2 transition-colors"
                  onClick={() => navigate(`/patient/${p.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <PawPrint className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.species} {p.breed ? `• ${p.breed}` : ''} — {p.owner_name}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
