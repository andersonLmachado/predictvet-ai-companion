import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Info, Activity, PawPrint, User } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// --- 1. Definição das Interfaces (O formato novo do n8n) ---
export interface ExamResultItem {
  parametro: string;
  valor_encontrado: number | string;
  unidade: string;
  ref_min: number | null;
  ref_max: number | null;
  status: "normal" | "alto" | "baixo";
  explicacao_curta: string;
}

export interface CabecalhoExame {
  nome_animal: string;
  especie_raca: string | null;
  idade: string | null;
  sexo: string | null;
  tutor: string | null;
}

export interface AnalysisResponse {
  cabecalho: CabecalhoExame;
  resumo_clinico: string;
  resultados: ExamResultItem[];
}

interface AnalysisResultsProps {
  result: AnalysisResponse;
  patientData?: CabecalhoExame;
}

// --- 2. Componente de Card Circular (Estilo BloodGPT) ---
const ResultCard = ({ item }: { item: ExamResultItem }) => {
  const valor = Number(item.valor_encontrado);
  const max = item.ref_max ? Number(item.ref_max) : valor * 1.5; // Se não tiver ref, usa o valor como base
  // Calcula porcentagem para o círculo (limitada a 100%)
  const percentage = Math.min(Math.max((valor / (max * 1.2)) * 100, 0), 100);
  
  const isNormal = item.status.toLowerCase() === "normal";
  const colorClass = isNormal ? "text-green-500" : "text-red-500";
  const strokeColor = isNormal ? "#22c55e" : "#ef4444";

  return (
    <Card className="overflow-hidden border-l-4 border-l-transparent hover:border-l-primary transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <span className="font-semibold text-sm truncate pr-2" title={item.parametro}>
          {item.parametro}
        </span>
        <Badge variant={isNormal ? "outline" : "destructive"} className="text-xs">
          {item.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          {/* Gráfico Circular SVG Simples */}
          <div className="relative h-16 w-16 flex-shrink-0">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Círculo de Fundo */}
              <path
                className="text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              {/* Círculo de Progresso */}
              <path
                className={colorClass}
                strokeDasharray={`${percentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={strokeColor}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-xs font-bold ${colorClass}`}>
                {item.valor_encontrado}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Unidade: {item.unidade}
            </p>
            {item.ref_min !== null && item.ref_max !== null && (
              <p className="text-[10px] text-muted-foreground">
                Ref: {item.ref_min} - {item.ref_max}
              </p>
            )}
          </div>
        </div>

        {/* Insight da IA */}
        <div className="mt-4 bg-muted/50 p-2 rounded-md flex gap-2 items-start">
          <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-tight">
            {item.explicacao_curta}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// --- 3. Componente Principal ---
const AnalysisResults = ({ result, patientData }: AnalysisResultsProps) => {
  
  // Determina quais dados mostrar: o selecionado manualmente (se houver) ou o da IA
  const displayData = patientData || result.cabecalho;

  // Função auxiliar para buscar dados para os gráficos antigos
  const findValue = (terms: string[]) => {
    const found = result.resultados.find((r) => 
      terms.some(term => r.parametro.toLowerCase().includes(term.toLowerCase()))
    );
    return found ? Number(found.valor_encontrado) : 0;
  };

  // Montagem dos dados para o Gráfico de Série Vermelha
  const eritrocitos = findValue(["Eritrócitos", "Hemácias"]);
  const hemoglobina = findValue(["Hemoglobina"]);
  const hematocrito = findValue(["Hematócrito"]);

  // Só mostra o gráfico se tiver pelo menos um dado > 0
  const hasRedSeries = eritrocitos > 0 || hemoglobina > 0 || hematocrito > 0;

  const redSeriesData = [
    { name: "Eritrócitos", valor: eritrocitos, fullMark: 8.5 },
    { name: "Hemoglobina", valor: hemoglobina, fullMark: 18 },
    { name: "Hematócrito", valor: hematocrito, fullMark: 55 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* SEÇÃO 0: Dados do Paciente */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="pt-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-primary/10 rounded-full">
                    <PawPrint className="w-8 h-8 text-primary" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-foreground">
                       {displayData.nome_animal}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                       {displayData.especie_raca || "Espécie/Raça não informada"}
                    </p>
                 </div>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-8 text-sm">
                 <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium text-muted-foreground">Tutor:</span>
                    <span>{displayData.tutor || "Não informado"}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="font-medium text-muted-foreground">Idade:</span>
                     <span>{displayData.idade || "Não informado"}</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="font-medium text-muted-foreground">Sexo:</span>
                     <span>{displayData.sexo || "Não informado"}</span>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 1: Resumo Clínico */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            Resumo Clínico da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/80">
            {result.resumo_clinico || "Nenhum resumo clínico gerado."}
          </p>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: Cards "BloodGPT" (Grade Responsiva) */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          Detalhamento dos Parâmetros
        </h3>
        {/* Aqui está o grid mágico: 1 coluna no celular, 2 no tablet, 3 no PC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.resultados.map((item, index) => (
            <ResultCard key={index} item={item} />
          ))}
        </div>
      </div>

      {/* SEÇÃO 3: Gráficos Clássicos (Série Vermelha) - Renderização Condicional */}
      {hasRedSeries && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Gráficos de Hemograma</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-500">Série Vermelha</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={redSeriesData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  {/* Barra de Fundo (Referência Máxima) */}
                  <Bar dataKey="fullMark" barSize={20} fill="#f3f4f6" radius={[0, 4, 4, 0]} stackId="a" />
                  {/* Barra de Valor Real */}
                  <Bar dataKey="valor" barSize={20} fill="#ef4444" radius={[0, 4, 4, 0]} stackId="b" /> 
                  {/* Nota: StackId diferente para sobrepor visualmente se usar posição absoluta, 
                      mas aqui simplifiquei. Para barra de progresso real, seria necessário custom shape.
                      Neste modelo simples, elas ficam lado a lado ou ajustamos para apenas mostrar o valor.
                  */}
                  <Bar dataKey="valor" fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Se não encontrar nada */}
      {result.resultados.length === 0 && (
        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
          Nenhum dado estruturado encontrado.
        </div>
      )}

    </div>
  );
};

export default AnalysisResults;
