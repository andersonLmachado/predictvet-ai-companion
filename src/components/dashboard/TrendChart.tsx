import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface TrendDataPoint {
  date: string;
  value: number;
  status: string;
}

interface TrendChartProps {
  parametro: string;
  unidade: string;
  data: TrendDataPoint[];
  refMin: number;
  refMax: number;
  highlightedDates?: [string, string];
  variationBadge?: { pct: number; color: 'green' | 'red' | 'gray' };
}

const getStatusColor = (status: string) => {
  if (status === 'normal') return '#10b981';
  if (status === 'baixo') return '#800020';
  return '#ef4444';
};

const CustomDot = (props: any) => {
  const { cx, cy, payload, highlightedDates } = props;
  if (!cx || !cy) return null;
  const color = getStatusColor(payload.status);

  const isSelected =
    !highlightedDates ||
    highlightedDates.some((d: string) => (payload.date as string).startsWith(d));
  const opacity = isSelected ? 1 : 0.2;
  const isActive =
    highlightedDates?.some((d: string) => (payload.date as string).startsWith(d));

  return (
    <g opacity={opacity}>
      {isActive && (
        <circle cx={cx} cy={cy} r={9} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.45} />
      )}
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={color}>
        {payload.value}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as TrendDataPoint;
  const color = getStatusColor(d.status);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-medium">{d.date}</p>
      <p style={{ color }} className="font-semibold">{d.value}</p>
      <p className="capitalize text-muted-foreground">{d.status}</p>
    </div>
  );
};

const generateInsight = (data: TrendDataPoint[], parametro: string): string | null => {
  if (data.length < 2) return null;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const diff = last.value - prev.value;
  const pct = prev.value !== 0 ? ((diff / prev.value) * 100).toFixed(1) : '0';
  const direction = diff > 0 ? 'subiu' : diff < 0 ? 'caiu' : 'manteve-se estável';

  if (diff === 0) return `${parametro} manteve-se estável em ${last.value} entre os últimos dois exames.`;

  const abs = Math.abs(parseFloat(pct));
  let context = '';
  if (last.status === 'normal' && prev.status !== 'normal') {
    context = ' — indicando retorno à faixa de referência.';
  } else if (last.status !== 'normal' && prev.status === 'normal') {
    context = ' — saindo da faixa de referência. Monitorar evolução.';
  } else if (last.status !== 'normal') {
    context = ' — ainda fora da faixa de referência.';
  } else {
    context = ' — dentro da faixa normal.';
  }

  return `${parametro} ${direction} ${abs}% (de ${prev.value} para ${last.value})${context}`;
};

const TrendChart: React.FC<TrendChartProps> = ({ parametro, unidade, data, refMin, refMax, highlightedDates, variationBadge }) => {
  const insight = generateInsight(data, parametro);
  const lastPoint = data[data.length - 1];
  const prevPoint = data.length >= 2 ? data[data.length - 2] : null;
  const trend = prevPoint ? lastPoint.value - prevPoint.value : 0;

  const chartConfig = {
    value: { label: parametro, color: 'hsl(var(--primary))' },
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{parametro}</CardTitle>
          <div className="flex items-center gap-1.5">
            {variationBadge ? (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background:
                    variationBadge.color === 'green'
                      ? 'hsl(162,60%,92%)'
                      : variationBadge.color === 'red'
                      ? 'hsl(352,76%,95%)'
                      : 'hsl(220,14%,93%)',
                  color:
                    variationBadge.color === 'green'
                      ? 'hsl(162,60%,28%)'
                      : variationBadge.color === 'red'
                      ? 'hsl(352,76%,35%)'
                      : 'hsl(222,30%,45%)',
                  fontFamily: 'Nunito Sans, sans-serif',
                }}
              >
                {variationBadge.color === 'gray'
                  ? '→'
                  : variationBadge.pct > 0
                  ? '↑'
                  : '↓'}{' '}
                {Math.abs(variationBadge.pct).toFixed(1)}%
              </span>
            ) : (
              <>
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-4 w-4" style={{ color: '#800020' }} />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
              </>
            )}
            <span className="text-xs text-muted-foreground">{unidade}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => {
                try { return format(new Date(v), 'dd/MM', { locale: ptBR }); } catch { return v; }
              }}
            />
            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            {refMin > 0 && (
              <ReferenceLine y={refMin} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.6} />
            )}
            <ReferenceLine y={refMax} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="transparent"
              dot={(dotProps: any) => <CustomDot {...dotProps} highlightedDates={highlightedDates} />}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ChartContainer>

        {insight && (
          <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
            <Brain className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
