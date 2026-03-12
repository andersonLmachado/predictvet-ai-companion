import xlsx from 'xlsx';
import { writeFileSync } from 'fs';

const wb = xlsx.readFile('/home/anderson/Documentos/PredictLab/predictvet-ai-companion/BANCO DE DADOS Montagem Planilha Atualizada.xlsx');
const ws = wb.Sheets['Planilha2'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

const CATEGORY_MARKERS = {
  'ANÁLISE FLUÍDOS / SECREÇÕES': 'Análise de Fluídos e Secreções',
  'ANÁLISE COMPORTAMENTAL': 'Análise Comportamental',
};

let currentCategory = 'Análise Física';
const categories = {};

for (let i = 2; i < rows.length; i++) {
  const row = rows[i];
  const label = row[1];
  const topic = row[2];
  const followup = row[3];

  if (!label && !topic) continue;

  if (CATEGORY_MARKERS[label]) {
    currentCategory = CATEGORY_MARKERS[label];
    continue;
  }

  if (!topic || !followup) continue;

  if (!categories[currentCategory]) {
    categories[currentCategory] = [];
  }

  const rawOptions = [row[4], row[5], row[6], row[7], row[8], row[9]]
    .map(o => String(o).trim())
    .filter(o => o && o !== 'Sim' && o !== 'Não' && o !== 'Não sei' && o !== '0');

  categories[currentCategory].push({
    id: String(i),
    label: String(label).trim(),
    topic: String(topic).trim(),
    followup: String(followup).trim(),
    options: ['Sim', 'Não', ...rawOptions, 'Não sei'],
  });
}

const result = Object.entries(categories).map(([category, complaints]) => ({
  category,
  complaints,
}));

writeFileSync('src/data/anamnesis.json', JSON.stringify(result, null, 2), 'utf-8');
console.log(`Done. ${result.reduce((acc, c) => acc + c.complaints.length, 0)} complaints written.`);
