import { BeerTasting } from '../types';

export type BadgeCategory =
  | 'estilos'
  | 'origen'
  | 'amargor'
  | 'color'
  | 'graduacion'
  | 'cantidad'
  | 'detalle'
  | 'valoracion';

export interface BadgeDefinition {
  id: string;
  categoria: BadgeCategory;
  nombre: string;
  desc: string;
  icono: string;
  evaluar: (cervezas: BeerTasting[]) => { current: number; target: number };
}

export interface EvaluatedBadge extends BadgeDefinition {
  current: number;
  target: number;
  progreso: number; // 0 to 1
  unlocked: boolean;
}

export interface CategoryInfo {
  id: BadgeCategory | 'todas';
  label: string;
  iconName: string; // Lucide or Material icon
  color: string;
}

export const BADGE_CATEGORIES: CategoryInfo[] = [
  { id: 'todas', label: 'Todas', iconName: 'sports_bar', color: '#fbad18' },
  { id: 'estilos', label: 'Estilos BJCP', iconName: 'menu_book', color: '#C9862E' },
  { id: 'origen', label: 'Origen', iconName: 'public', color: '#9C5630' },
  { id: 'amargor', label: 'Amargor', iconName: 'percent', color: '#7C9A5B' },
  { id: 'color', label: 'Color', iconName: 'palette', color: '#E8B93F' },
  { id: 'graduacion', label: 'Graduación', iconName: 'local_fire_department', color: '#B5502C' },
  { id: 'cantidad', label: 'Cantidad', iconName: 'inventory_2', color: '#fbad18' },
  { id: 'detalle', label: 'Detalle de cata', iconName: 'rate_review', color: '#7C9A5B' },
  { id: 'valoracion', label: 'Valoración', iconName: 'star', color: '#E8B93F' },
];

export const getCategoryColor = (catId: string): string => {
  const cat = BADGE_CATEGORIES.find((c) => c.id === catId);
  return cat ? cat.color : '#fbad18';
};

const norm = (s: unknown = ''): string => (s ? String(s).toLowerCase().trim() : '');

const uniqueBy = <T>(arr: T[], fn: (item: T) => string): number => {
  const validItems = arr.map(fn).filter((val) => Boolean(val && val.length > 0));
  return new Set(validItems).size;
};

const includesAny = (text: string, keywords: string[]): boolean =>
  keywords.some((k) => text.includes(k));

// Familias de estilo BJCP
const FAMILIAS: Record<string, string[]> = {
  ipa: ['ipa', 'pale ale', 'neipa', 'hazy', 'india pale ale'],
  tostada: ['stout', 'porter', 'schwarzbier', 'torrefacta'],
  lager: ['lager', 'pilsner', 'pils', 'bock', 'helles', 'marzen', 'märzen', 'vienna', 'kellerbier', 'dortmunder'],
  trigo: ['weizen', 'witbier', 'wheat', 'hefeweizen', 'trigo', 'dunkelweizen', 'weizenbock'],
  belga: ['belgian', 'belga', 'dubbel', 'tripel', 'trappist', 'saison', 'quad', 'abadía', 'abadia', 'blonde ale', 'flanders'],
  acida: ['sour', 'lambic', 'gueuze', 'gose', 'wild', 'ácida', 'acida', 'flanders', 'berliner weisse'],
};

const getEffectiveEbc = (c: BeerTasting): number => {
  if (c.ebc && c.ebc > 0) return c.ebc;
  if (c.srm && c.srm > 0) return Math.round(c.srm * 1.97);
  return 10;
};

const familiaCount = (cervezas: BeerTasting[], familia: string): number =>
  uniqueBy(
    cervezas.filter((c) => includesAny(norm(c.style), FAMILIAS[familia])),
    (c) => norm(c.style)
  );

const enBanda = (valor: number, min: number, max: number): boolean =>
  valor >= min && valor < max;

// Insignias del sistema de gamificación
export const INSIGNIAS_DEFINITIONS: BadgeDefinition[] = [
  // ---------- ESTILOS ----------
  {
    id: 'lupulado',
    categoria: 'estilos',
    nombre: 'Explorador Lupulado',
    desc: 'Prueba 3 estilos distintos de la familia IPA / Pale Ale.',
    icono: '🌿',
    evaluar: (cs) => ({ current: familiaCount(cs, 'ipa'), target: 3 }),
  },
  {
    id: 'tostado',
    categoria: 'estilos',
    nombre: 'Maestro Tostado',
    desc: 'Prueba 3 estilos de la familia Stout / Porter.',
    icono: '🖤',
    evaluar: (cs) => ({ current: familiaCount(cs, 'tostada'), target: 3 }),
  },
  {
    id: 'lagers',
    categoria: 'estilos',
    nombre: 'Ruta de las Lagers',
    desc: 'Cata 5 lagers de estilos distintos.',
    icono: '🍻',
    evaluar: (cs) => ({ current: familiaCount(cs, 'lager'), target: 5 }),
  },
  {
    id: 'belga',
    categoria: 'estilos',
    nombre: 'Alma Belga',
    desc: 'Prueba 3 estilos belgas (Dubbel, Tripel, Trappist, Saison...).',
    icono: '✝️',
    evaluar: (cs) => ({ current: familiaCount(cs, 'belga'), target: 3 }),
  },
  {
    id: 'coleccionista',
    categoria: 'estilos',
    nombre: 'Coleccionista de Estilos',
    desc: 'Registra 15 estilos BJCP distintos en tu bitácora.',
    icono: '📚',
    evaluar: (cs) => ({ current: uniqueBy(cs, (c) => norm(c.style)), target: 15 }),
  },

  // ---------- ORIGEN ----------
  {
    id: 'turista',
    categoria: 'origen',
    nombre: 'Turista Cervecero',
    desc: 'Cata cervezas de 5 países distintos.',
    icono: '🧳',
    evaluar: (cs) => ({ current: uniqueBy(cs, (c) => norm(c.country)), target: 5 }),
  },
  {
    id: 'globetrotter',
    categoria: 'origen',
    nombre: 'Globetrotter del Lúpulo',
    desc: 'Alcanza 12 países distintos en tus catas.',
    icono: '🌍',
    evaluar: (cs) => ({ current: uniqueBy(cs, (c) => norm(c.country)), target: 12 }),
  },
  {
    id: 'vueltamundo',
    categoria: 'origen',
    nombre: 'Vuelta al Mundo',
    desc: 'Alcanza 20 países distintos en tus catas.',
    icono: '✈️',
    evaluar: (cs) => ({ current: uniqueBy(cs, (c) => norm(c.country)), target: 20 }),
  },

  // ---------- AMARGOR (IBU) ----------
  {
    id: 'suave',
    categoria: 'amargor',
    nombre: 'Paladar Suave',
    desc: 'Cata una cerveza con menos de 15 IBU.',
    icono: '🌸',
    evaluar: (cs) => ({ current: cs.some((c) => (c.ibu || 0) < 15) ? 1 : 0, target: 1 }),
  },
  {
    id: 'lupulo',
    categoria: 'amargor',
    nombre: 'Amante del Lúpulo',
    desc: 'Cata una cerveza con más de 70 IBU.',
    icono: '🔥',
    evaluar: (cs) => ({ current: cs.some((c) => (c.ibu || 0) > 70) ? 1 : 0, target: 1 }),
  },
  {
    id: 'espectro',
    categoria: 'amargor',
    nombre: 'Espectro Completo',
    desc: 'Cubre las 3 bandas de amargor: baja (<15), media (15-60) y alta (>=60).',
    icono: '📈',
    evaluar: (cs) => {
      const bandas = [
        cs.some((c) => (c.ibu || 0) < 15),
        cs.some((c) => enBanda(c.ibu || 0, 15, 60)),
        cs.some((c) => (c.ibu || 0) >= 60),
      ];
      return { current: bandas.filter(Boolean).length, target: 3 };
    },
  },

  // ---------- COLOR (EBC) ----------
  {
    id: 'rubia',
    categoria: 'color',
    nombre: 'Rubia Radiante',
    desc: 'Cata una cerveza muy pálida (EBC menor de 10).',
    icono: '💛',
    evaluar: (cs) => ({ current: cs.some((c) => getEffectiveEbc(c) < 10) ? 1 : 0, target: 1 }),
  },
  {
    id: 'negra',
    categoria: 'color',
    nombre: 'Negra Absoluta',
    desc: 'Cata una cerveza muy oscura (EBC de 80 o más).',
    icono: '🖤',
    evaluar: (cs) => ({ current: cs.some((c) => getEffectiveEbc(c) >= 80) ? 1 : 0, target: 1 }),
  },
  {
    id: 'arcoiris',
    categoria: 'color',
    nombre: 'Arcoíris Cervecero',
    desc: 'Cubre las 4 franjas de color: pajiza (<8), dorada (8-20), ámbar (20-50) y negra (>=50 EBC).',
    icono: '🎨',
    evaluar: (cs) => {
      const bandas = [
        cs.some((c) => getEffectiveEbc(c) < 8),
        cs.some((c) => enBanda(getEffectiveEbc(c), 8, 20)),
        cs.some((c) => enBanda(getEffectiveEbc(c), 20, 50)),
        cs.some((c) => getEffectiveEbc(c) >= 50),
      ];
      return { current: bandas.filter(Boolean).length, target: 4 };
    },
  },

  // ---------- GRADUACIÓN (ABV) ----------
  {
    id: 'sesion',
    categoria: 'graduacion',
    nombre: 'Sesión Ligera',
    desc: 'Cata una cerveza de sesión, con menos de 4,5% ABV.',
    icono: '💧',
    evaluar: (cs) => ({ current: cs.some((c) => (c.abv || 0) < 4.5) ? 1 : 0, target: 1 }),
  },
  {
    id: 'pesopesado',
    categoria: 'graduacion',
    nombre: 'Peso Pesado',
    desc: 'Cata una cerveza con 9% ABV o más.',
    icono: '🥊',
    evaluar: (cs) => ({ current: cs.some((c) => (c.abv || 0) >= 9) ? 1 : 0, target: 1 }),
  },

  // ---------- CANTIDAD ----------
  {
    id: 'primera',
    categoria: 'cantidad',
    nombre: 'Primera Cata',
    desc: 'Registra tu primera cerveza en la bitácora.',
    icono: '🍺',
    evaluar: (cs) => ({ current: cs.length, target: 1 }),
  },
  {
    id: 'aficionado',
    categoria: 'cantidad',
    nombre: 'Bebedor Aficionado',
    desc: 'Registra 10 cervezas.',
    icono: '📖',
    evaluar: (cs) => ({ current: cs.length, target: 10 }),
  },
  {
    id: 'experto',
    categoria: 'cantidad',
    nombre: 'Catador Experto',
    desc: 'Registra 50 cervezas.',
    icono: '🎓',
    evaluar: (cs) => ({ current: cs.length, target: 50 }),
  },
  {
    id: 'maestro',
    categoria: 'cantidad',
    nombre: 'Maestro Cervecero',
    desc: 'Registra 100 cervezas.',
    icono: '🏆',
    evaluar: (cs) => ({ current: cs.length, target: 100 }),
  },
  {
    id: 'leyenda',
    categoria: 'cantidad',
    nombre: 'Leyenda del Diario',
    desc: 'Registra 300 cervezas.',
    icono: '👑',
    evaluar: (cs) => ({ current: cs.length, target: 300 }),
  },

  // ---------- DETALLE DE CATA ----------
  {
    id: 'sumiller',
    categoria: 'detalle',
    nombre: 'Sumiller Cervecero',
    desc: 'Anota una propuesta de maridaje en 15 cervezas.',
    icono: '🍽️',
    evaluar: (cs) => ({
      current: cs.filter((c) => (c.pairing || '').trim().length > 0).length,
      target: 15,
    }),
  },
  {
    id: 'cronista',
    categoria: 'detalle',
    nombre: 'Cronista de Cata',
    desc: 'Escribe notas de cata detalladas (50+ caracteres) en 20 cervezas.',
    icono: '✍️',
    evaluar: (cs) => ({
      current: cs.filter((c) => (c.notes || '').trim().length >= 50).length,
      target: 20,
    }),
  },

  // ---------- VALORACIÓN ----------
  {
    id: 'honesto',
    categoria: 'valoracion',
    nombre: 'Paladar Honesto',
    desc: 'Puntúa alguna cerveza con 2 estrellas o menos: no todo puede ser perfecto.',
    icono: '🎯',
    evaluar: (cs) => ({ current: cs.some((c) => (c.rating || 0) <= 2) ? 1 : 0, target: 1 }),
  },
  {
    id: 'toptier',
    categoria: 'valoracion',
    nombre: 'Top Tier',
    desc: 'Otorga tu nota máxima (4,5+) a 10 cervezas.',
    icono: '⭐',
    evaluar: (cs) => ({
      current: cs.filter((c) => (c.rating || 0) >= 4.5).length,
      target: 10,
    }),
  },
];

export function evaluarInsignias(cervezas: BeerTasting[]): EvaluatedBadge[] {
  return INSIGNIAS_DEFINITIONS.map((ins) => {
    const { current, target } = ins.evaluar(cervezas);
    const clamped = Math.min(current, target);
    return {
      ...ins,
      current: clamped,
      target,
      progreso: target > 0 ? clamped / target : 0,
      unlocked: clamped >= target,
    };
  });
}
