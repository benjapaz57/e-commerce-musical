import { SETTINGS } from './settings.definitions.js';

describe('definiciones de ajustes', () => {
  it('los valores por defecto son válidos', () => {
    for (const [key, def] of Object.entries(SETTINGS)) {
      expect(def.validate(def.defaultValue), key).toBeNull();
    }
  });

  it('rechaza planes con precio o cupo inválido', () => {
    const v = SETTINGS.planes.validate;
    expect(v({ inicial: { amountUsd: 0, maxActive: 10 }, completo: { amountUsd: 5, maxActive: 30 } })).not.toBeNull();
    expect(v({ inicial: { amountUsd: 2, maxActive: 1.5 }, completo: { amountUsd: 5, maxActive: 30 } })).not.toBeNull();
    expect(v({ inicial: { amountUsd: 2.5, maxActive: 10 }, completo: { amountUsd: 5, maxActive: 30 } })).toBeNull();
  });

  it('rechaza un tipo de dólar desconocido', () => {
    expect(SETTINGS.cotizacion.validate({ provider: 'dolarapi', kind: 'euro', refreshMinutes: 30 })).not.toBeNull();
  });
});
