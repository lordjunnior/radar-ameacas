import { useState } from 'react';
import { MapPin, LocateFixed } from 'lucide-react';
import { SuiteHero, Faq } from './SovereignKit';
import { assessHazards, type Hazard } from './lib/public-radar';

type Place = { name: string; admin1?: string; country?: string; latitude: number; longitude: number };
type Res = { place: string; hazards: Hazard[]; at: string };
const tag = { normal: ['NORMAL', 'ss-ok'], atencao: ['ATENÃ‡ÃƒO', 'ss-bad'], alerta: ['ALERTA', 'ss-bad'] } as const;

async function analyse(lat: number, lon: number) {
  const f = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max,uv_index_max&forecast_days=7&timezone=auto`).then(r => r.json());
  const start = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const q = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=500&starttime=${start}&orderby=magnitude&limit=1`).then(r => r.json()).catch(() => ({ features: [] }));
  const d = f.daily, max = (a: number[]) => Math.max(...a.filter(n => n != null)), min = (a: number[]) => Math.min(...a.filter(n => n != null));
  return assessHazards({ maxTemp: max(d.temperature_2m_max), minTemp: min(d.temperature_2m_min), rainMm: max(d.precipitation_sum), windKmh: max(d.wind_gusts_10m_max), uv: max(d.uv_index_max), quakeMag: q.features?.[0]?.properties?.mag ?? 0 });
}

export default function RadarAmeacas() {
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);
  const [err, setErr] = useState('');

  const go = async (lat: number, lon: number, place: string) => {
    try { setRes({ place, hazards: await analyse(lat, lon), at: new Date().toLocaleString('pt-BR') }); }
    catch { setErr('As fontes de previsÃ£o nÃ£o responderam. Tente de novo.'); }
    setBusy(false);
  };
  const search = async () => {
    if (!city.trim()) return;
    setBusy(true); setErr(''); setRes(null);
    try {
      const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`).then(r => r.json());
      const p: Place | undefined = g.results?.[0];
      if (!p) { setErr('Cidade nÃ£o encontrada.'); setBusy(false); return; }
      await go(p.latitude, p.longitude, [p.name, p.admin1, p.country].filter(Boolean).join(', '));
    } catch { setErr('A busca de cidades nÃ£o respondeu.'); setBusy(false); }
  };
  const locate = () => {
    if (!navigator.geolocation) return setErr('Seu navegador nÃ£o permite localizaÃ§Ã£o.');
    setBusy(true); setErr(''); setRes(null);
    navigator.geolocation.getCurrentPosition(p => go(p.coords.latitude, p.coords.longitude, 'Sua posiÃ§Ã£o atual'), () => { setErr('LocalizaÃ§Ã£o negada. Digite a cidade.'); setBusy(false); });
  };

  const active = res?.hazards.filter(h => h.level !== 'normal') ?? [];
  const kit = [...new Set(active.flatMap(h => h.kit))];

  return <div className="ss-root">
    <SuiteHero kicker="Soberania fÃ­sica Â· Kit 72h" title="Radar de" accent="AmeaÃ§as" repo="https://open-meteo.com" repoLabel="OPEN-METEO Â· USGS" prefix="DADOS ABERTOS DE"
      note="A LOCALIZAÃ‡ÃƒO Ã‰ USADA SÃ“ PARA A CONSULTA E NÃƒO Ã‰ GUARDADA"
      lead="Informe a sua cidade e veja os riscos dos prÃ³ximos 7 dias: chuva forte, vento, calor, frio, radiaÃ§Ã£o UV e tremores de terra nos Ãºltimos 30 dias. Para cada risco ativo, a lista do que reforÃ§ar no seu Kit 72h." />
    <div className="ss-wrap">
      <section className="ss-plate">
        <span className="ss-tag">01 Â· LOCAL</span>
        <h2>Onde vocÃª estÃ¡</h2>
        <div className="ss-row" style={{ marginTop: 0 }}>
          <input aria-label="Cidade" className="ss-input" style={{ flex: 1 }} placeholder="Ex.: Lisboa, Curitiba, AssunÃ§Ã£o" value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
          <button type="button" className="ss-btn" disabled={busy} onClick={search}><MapPin size={14} />{busy ? 'Varrendoâ€¦' : 'Analisar'}</button>
          <button type="button" className="ss-btn ghost" disabled={busy} onClick={locate}><LocateFixed size={14} />Usar minha posiÃ§Ã£o</button>
        </div>
        {err && <p className="ss-warn" style={{ marginTop: 16 }}>{err}</p>}
      </section>
      {res && <>
        <section className="ss-plate" aria-live="polite">
          <span className="ss-tag">02 Â· RISCOS Â· {res.place}</span>
          <h2>{active.length ? `${active.length} risco(s) ativo(s)` : 'Sem riscos relevantes'}</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {res.hazards.map((h, i) => <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, padding: '10px 12px', background: i % 2 ? 'transparent' : 'color-mix(in oklab, var(--primary) 7%, transparent)', borderLeft: `2px solid var(${h.level === 'normal' ? '--border' : h.level === 'alerta' ? '--ember' : '--primary'})` }}>
              <b className={tag[h.level][1]} style={{ fontSize: 11 }}>{tag[h.level][0]}</b>
              <span style={{ fontSize: 13 }}><b>{h.title}</b> Â· {h.detail}</span>
            </div>)}
          </div>
          <p className="ss-sub" style={{ marginTop: 12 }}>Consultado em {res.at}. PrevisÃ£o Open-Meteo (7 dias) e sismos USGS (raio de 500 km, 30 dias). LimitaÃ§Ã£o: nÃ£o substitui alertas da Defesa Civil local.</p>
        </section>
        <section className="ss-plate">
          <span className="ss-tag">03 Â· KIT 72H</span>
          <h2>O que reforÃ§ar agora</h2>
          {kit.length ? <ul style={{ display: 'grid', gap: 8, fontSize: 13 }}>{kit.map((k, i) => <li key={k}>{String(i + 1).padStart(2, '0')} Â· {k}</li>)}</ul> : <p className="ss-sub">Mantenha o kit bÃ¡sico: Ã¡gua, alimento, documentos, rÃ¡dio e remÃ©dios.</p>}
          <a className="ss-btn ghost" style={{ marginTop: 16, display: 'inline-flex' }} href="/soberania-organica/kit-72h">Abrir o Protocolo 72h</a>
        </section>
      </>}
      <Faq items={[{ q: 'Minha localizaÃ§Ã£o fica salva?', a: 'NÃ£o. Ela Ã© enviada sÃ³ para as fontes de previsÃ£o no momento da consulta.' }]} />
    </div>
  </div>;
}

