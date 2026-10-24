// Ajustes editables desde el panel. Cada uno define su valor inicial y cómo se valida.
// Agregar un ajuste nuevo = agregar una entrada acá (el seed lo crea solo).

type Validator = (value: unknown) => string | null; // null = válido, texto = error

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const posInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) > 0 && (v as number) <= max;
const posMoney = (v: unknown) => typeof v === 'number' && v > 0 && v <= 1000 && Math.round(v * 100) === v * 100;

export interface SettingDefinition {
  label: string;
  description: string;
  defaultValue: unknown;
  validate: Validator;
}

export const SETTINGS: Record<string, SettingDefinition> = {
  planes: {
    label: 'Planes de vendedor',
    description: 'Precio en USD (pago único) y cantidad máxima de publicaciones activas a la vez.',
    defaultValue: {
      inicial: { amountUsd: 2, maxActive: 10 },
      completo: { amountUsd: 5, maxActive: 30 },
    },
    validate: (v) => {
      if (!isObj(v)) return 'Formato inválido.';
      for (const key of ['inicial', 'completo']) {
        const p = v[key];
        if (!isObj(p)) return `Falta el plan "${key}".`;
        if (!posMoney(p.amountUsd)) return `El precio del plan "${key}" debe ser un monto positivo en USD.`;
        if (!posInt(p.maxActive, 1000)) return `El cupo del plan "${key}" debe ser un número entero positivo.`;
      }
      return null;
    },
  },
  cotizacion: {
    label: 'Cotización de referencia',
    description: 'Fuente y tipo de dólar usados para convertir precios, y cada cuántos minutos se actualiza.',
    defaultValue: { provider: 'dolarapi', kind: 'blue', refreshMinutes: 30 },
    validate: (v) => {
      if (!isObj(v)) return 'Formato inválido.';
      if (v.provider !== 'dolarapi') return 'Por ahora la única fuente disponible es DolarAPI.';
      const kinds = ['blue', 'oficial', 'bolsa', 'contadoconliqui', 'tarjeta', 'mayorista', 'cripto'];
      if (typeof v.kind !== 'string' || !kinds.includes(v.kind)) return `El tipo de dólar debe ser uno de: ${kinds.join(', ')}.`;
      if (!posInt(v.refreshMinutes, 1440) || (v.refreshMinutes as number) < 5) return 'La actualización debe ser entre 5 y 1440 minutos.';
      return null;
    },
  },
  limitesCuentasNuevas: {
    label: 'Límites para cuentas nuevas',
    description: 'Topes contra el spam durante los primeros días de una cuenta. Valores iniciales a ajustar con uso real.',
    defaultValue: { diasCuentaNueva: 30, conversacionesPorDia: 10 },
    validate: (v) => {
      if (!isObj(v)) return 'Formato inválido.';
      if (!posInt(v.diasCuentaNueva, 365)) return 'Los días de cuenta nueva deben ser un entero entre 1 y 365.';
      if (!posInt(v.conversacionesPorDia, 1000)) return 'Las conversaciones por día deben ser un entero positivo.';
      return null;
    },
  },
};
