import { describe, expect, it } from 'vitest';
import { assessHazards } from './public-radar';

describe('Radar de Ameaças', () => {
  it('classifies heavy rain as an alert', () => {
    const risks = assessHazards({ maxTemp: 25, minTemp: 15, rainMm: 80, windKmh: 10, uv: 3, quakeMag: 0 });
    expect(risks.find(item => item.id === 'chuva')?.level).toBe('alerta');
    expect(risks.find(item => item.id === 'vento')?.level).toBe('normal');
  });

  it('flags extreme wind and heat', () => {
    const risks = assessHazards({ maxTemp: 41, minTemp: 12, rainMm: 0, windKmh: 80, uv: 5, quakeMag: 0 });
    expect(risks.find(item => item.id === 'vento')?.level).toBe('alerta');
    expect(risks.find(item => item.id === 'calor')?.level).toBe('alerta');
  });

  it('keeps ordinary conditions in the normal band', () => {
    const risks = assessHazards({ maxTemp: 26, minTemp: 17, rainMm: 4, windKmh: 20, uv: 4, quakeMag: 0 });
    expect(risks.every(item => item.level === 'normal')).toBe(true);
  });
});