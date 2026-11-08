export type Hazard = {
  id: string;
  level: 'normal' | 'atencao' | 'alerta';
  title: string;
  detail: string;
  kit: string[];
};

/** Classifica indicadores meteorológicos e sísmicos em faixas operacionais. */
export function assessHazards(d: {
  maxTemp: number;
  minTemp: number;
  rainMm: number;
  windKmh: number;
  uv: number;
  quakeMag: number;
}): Hazard[] {
  const out: Hazard[] = [];
  const level = (attention: boolean, alert: boolean): Hazard['level'] =>
    alert ? 'alerta' : attention ? 'atencao' : 'normal';

  out.push({ id: 'chuva', level: level(d.rainMm >= 30, d.rainMm >= 60), title: 'Chuva e alagamento', detail: `${d.rainMm.toFixed(0)} mm previstos no dia mais chuvoso`, kit: ['Documentos em saco estanque', 'Lanterna e pilhas', 'Rota de saída para área alta'] });
  out.push({ id: 'vento', level: level(d.windKmh >= 50, d.windKmh >= 75), title: 'Vento forte', detail: `rajadas de até ${d.windKmh.toFixed(0)} km/h`, kit: ['Rádio a pilha ou manivela', 'Fita e lona', 'Celular carregado e power bank'] });
  out.push({ id: 'calor', level: level(d.maxTemp >= 35, d.maxTemp >= 40), title: 'Calor extremo', detail: `máxima de ${d.maxTemp.toFixed(0)} °C`, kit: ['Água potável', 'Sombra e ventilação', 'Evitar esforço nos horários mais quentes'] });
  out.push({ id: 'frio', level: level(d.minTemp <= 5, d.minTemp <= 0), title: 'Frio intenso', detail: `mínima de ${d.minTemp.toFixed(0)} °C`, kit: ['Manta térmica', 'Roupas em camadas', 'Alimento e água'] });
  out.push({ id: 'uv', level: level(d.uv >= 8, d.uv >= 11), title: 'Radiação UV', detail: `índice máximo ${d.uv.toFixed(0)}`, kit: ['Proteção solar', 'Chapéu e óculos', 'Buscar sombra'] });
  out.push({ id: 'sismo', level: level(d.quakeMag >= 4, d.quakeMag >= 6), title: 'Atividade sísmica', detail: d.quakeMag > 0 ? `maior tremor em 30 dias: magnitude ${d.quakeMag.toFixed(1)}` : 'nenhum tremor registrado em 30 dias', kit: ['Ponto de encontro combinado', 'Calçado firme perto da cama', 'Apito'] });
  return out;
}