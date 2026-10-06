import {
  BeerTasting,
  ClarityType,
  BrillanteType,
  FoamType,
  FoamColorType,
  FoamAdherenceType,
  FoamPersistenceType,
  CarbonationType,
  AromaRadarValues,
  SaborRadarValues,
} from '../types';
import { BJCP_STYLES } from '../data/bjcpStyles';

export interface FieldMapping {
  sourceColumn: string;
  targetField: keyof BeerTasting | 'ignore' | 'aromaRadarDulce' | 'aromaRadarAmargo' | 'aromaRadarAcido' | 'aromaRadarLupulo' | 'aromaRadarMalta' | 'saborRadarDulce' | 'saborRadarAmargo' | 'saborRadarSeco' | 'saborRadarAcido' | 'saborRadarFusel';
  confidence: number;
}

export interface ParsedDatabaseResult {
  fileName: string;
  fileType: 'csv' | 'json';
  totalRows: number;
  availableColumns: string[];
  suggestedMappings: FieldMapping[];
  rawRows: Record<string, any>[];
  previewTastings: BeerTasting[];
}

const PRESET_FALLBACK_PHOTOS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCC_9PJePcFLLcmRE6sUfky3cjo9U1uS6kSCsEq92ZLKF91Wi_6oV82C_vygjZ-Pl9n7lHja7CgD1rPvD_Jrzo9wOxw76iCEMsjFSKcxPTEtgTTNMW4q91IXep0-l9WM_oLiFwKsvxTEoYY6egS5Wq27u459SEjfmVutKeDlkWamGBR5k73CPM1ehNquhO09SdS8l6nfcWCXcUyGfEM4CcbXlxc8QxOTAm4XkwiOkBuSh0fPiE8uOCB4A', // Hazy / Amber
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ7aJlCxcIADr_j5ceS6PBqb7STnIcPyi70BHDDqIF6UZG5aQ9X7Q1EwEqw8OKRiPr7yjVC2t6_oa2LjWWnvQ3ZT4xGhFetoOTMoL1IC_lK9kvjoaNCKqK8_AaPV6yKjvOjoO1ZksF7QOgPvZEjfcPQH_2U0kPT6qlVaALpgNpELmi5k3MYEX8ITwBLkMpJMvh9o0BZDroPNIolWpAdAYI-zEaXWxSxRbY5dFbOmOLb8eJv06N5QCzxA', // Golden Lager
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDVYqD1Yx-hlakQo0vx37q1DneDT056e_yoV-BF2DOp-R7cLjILHwV_jPT4pEWawzLf-elnsaEA1U2YUt8DLiGAMzgZZTzmepUEN7toemTB-7iOx4rXzOQ23doYWTFTZD4v-yjytSPfSaBSV3GsfNUq9Rf4hTqXtq6eDS-InyINXer76oVFH99TkxF2WvHYpBffiVWQIL_t1PUBWjM4HqUw7AUBOcOHc0sKOnmodFXJJiqatyb-wROffw', // Stout / Dark
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBvQ3cdSj1fb1-P0_IZjX19_KXMd0YrFiT7xMzNd89SCso-1ufx6s_Lg_Zj07ZvyB0aMeykZGcv29gUSK0eS99qtnCiadS2Ili0RKWm62AEDFTNjR2aCzHIli8w5_vV6WgonWVTD_H8Cg7lcwD3-I6r-CK_vYLbEIK4Ekpb7y8J7NVFN8jhrvktBToq76h1VdSolMJnlSJhGuxG8DY1tUMpEttJDEeMM0nWFDC-_wme6PNytix8GRUGgA', // Sour / Red
];

/**
 * Normaliza una cadena para comparaciones flexibles (elimina tildes, símbolos y espacios redundantes).
 */
export function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Diccionario semántico de columnas para detectar automáticamente correspondencias.
 */
const FIELD_MATCHERS: Record<string, string[]> = {
  name: [
    'nombre cerveza', 'nombre de la cerveza', 'cerveza', 'beer', 'beer name',
    'nombre', 'name', 'titulo', 'title', 'item', 'producto', 'product'
  ],
  brewery: [
    'cerveceria', 'cervecera', 'brewery', 'brewer', 'fabricante',
    'productor', 'marca', 'brand', 'elaborador', 'fabrica'
  ],
  style: [
    'estilo bjcp', 'estilo de cerveza', 'estilo', 'style', 'beer style',
    'subestilo', 'tipo', 'clase', 'categoria', 'category'
  ],
  abv: [
    'graduacion alcoholica abv', 'graduacion alcoholica', 'graduacion',
    'alcohol', 'abv', 'alc', 'vol', 'volumen alcoholico', 'alcohol by volume'
  ],
  ibu: [
    'amargor ibu', 'amargor', 'ibu', 'ibus', 'bitterness', 'international bitterness units'
  ],
  srm: [
    'color srm', 'srm', 'color', 'ebc', 'color ebc', 'tonalidad'
  ],
  rating: [
    'puntuacion 1 5', 'puntuacion', 'rating', 'valoracion', 'nota',
    'score', 'estrellas', 'stars', 'calificacion'
  ],
  country: [
    'pais de origen', 'pais', 'country', 'origen', 'nacion', 'procedencia'
  ],
  notes: [
    'notas de cata', 'notas', 'notes', 'comentarios', 'comentario', 'comments', 'comment',
    'opinion', 'review', 'reviews', 'observaciones', 'descripcion', 'description', 'cata', 'resena'
  ],
  pairing: [
    'maridaje sugerido', 'maridaje', 'pairing', 'comida', 'armonia'
  ],
  aromaDescriptors: [
    'descriptores de aroma', 'aroma descriptores', 'aroma tags', 'perfil aroma',
    'aroma descriptors', 'descriptores aroma', 'aroma'
  ],
  saborDescriptors: [
    'descriptores de sabor', 'sabor descriptores', 'gusto', 'perfil sabor',
    'flavor descriptors', 'descriptores sabor', 'sabor', 'paladar'
  ],
  otherDescriptors: [
    'otros descriptores', 'descriptores', 'tags', 'etiquetas', 'descriptors', 'perfil'
  ],
  clarity: [
    'claridad', 'clarity', 'aspecto', 'apariencia', 'turbidez'
  ],
  brillante: [
    'brillante', 'brillo', 'brillantez', 'shine', 'bright', 'brightness'
  ],
  foamType: [
    'tipo de espuma', 'espuma', 'foam', 'foam type', 'cabeza'
  ],
  foamColor: [
    'color espuma', 'color de espuma', 'foam color', 'head color', 'tono espuma'
  ],
  foamAdherence: [
    'adherencia espuma', 'adherencia de espuma', 'adherencia', 'lacing', 'foam adherence'
  ],
  foamPersistence: [
    'persistencia espuma', 'persistencia de espuma', 'persistencia', 'retencion', 'foam retention', 'foam persistence'
  ],
  carbonation: [
    'carbonatacion', 'carbonation', 'gas', 'burbuja'
  ],
  imageUrl: [
    'url imagen', 'imagen', 'image', 'image url', 'foto', 'photo', 'url foto', 'portada'
  ],
  createdAt: [
    'fecha de registro', 'fecha', 'date', 'created at', 'fecha cata', 'timestamp'
  ],
  // Campos sensoriales de radar
  aromaRadarDulce: ['aroma dulce', 'aroma sweet', 'dulzor aroma'],
  aromaRadarAmargo: ['aroma amargo', 'aroma bitter', 'amargor aroma'],
  aromaRadarAcido: ['aroma acido', 'aroma sour', 'acidez aroma'],
  aromaRadarLupulo: ['aroma lupulo', 'aroma hop', 'lupulo aroma'],
  aromaRadarMalta: ['aroma malta', 'aroma malt', 'malta aroma'],
  saborRadarDulce: ['sabor dulce', 'sabor sweet', 'dulzor sabor'],
  saborRadarAmargo: ['sabor amargo', 'sabor bitter', 'amargor sabor'],
  saborRadarSeco: ['sabor seco', 'sabor dry', 'sequedad sabor'],
  saborRadarAcido: ['sabor acido', 'sabor sour', 'acidez sabor'],
  saborRadarFusel: ['sabor fusel', 'sabor alcohol', 'alcohol sabor']
};

/**
 * Analiza una lista de columnas y devuelve la asignación sugerida con su nivel de confianza.
 */
export function analyzeColumns(columns: string[]): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const assignedTargets = new Set<string>();

  for (const col of columns) {
    const norm = normalizeKey(col);
    let bestTarget: FieldMapping['targetField'] = 'ignore';
    let bestConfidence = 0;

    for (const [targetKey, synonyms] of Object.entries(FIELD_MATCHERS)) {
      // Coincidencia exacta
      if (synonyms.some((s) => s === norm)) {
        bestTarget = targetKey as any;
        bestConfidence = 1.0;
        break;
      }
      // Subcadena directa
      for (const syn of synonyms) {
        if (norm.includes(syn) || syn.includes(norm)) {
          const confidence = 0.85;
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestTarget = targetKey as any;
          }
        }
      }
    }

    // Evitar asignar el mismo campo dos veces a menos que sea ignorado
    if (bestTarget !== 'ignore' && assignedTargets.has(bestTarget)) {
      // Si ya está asignado, preferimos la que tenga mayor coincidencia
      mappings.push({ sourceColumn: col, targetField: 'ignore', confidence: 0 });
    } else {
      if (bestTarget !== 'ignore') assignedTargets.add(bestTarget);
      mappings.push({ sourceColumn: col, targetField: bestTarget, confidence: bestConfidence });
    }
  }

  return mappings;
}

/**
 * Parser de texto CSV compatible con comillas escapadas (""), saltos de línea y diferentes separadores (, ; \t).
 */
export function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  // Limpieza de Byte Order Mark (BOM) si existe
  const clean = content.replace(/^\uFEFF/, '').trim();
  if (!clean) return { headers: [], rows: [] };

  // Detectar delimitador inspeccionando la primera línea
  const firstLine = clean.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  }

  // Tokenizador de CSV tolerante a comillas
  const parseRows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // Saltar comilla escapada
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Saltar \r\n
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        parseRows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Última celda / fila
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      parseRows.push(currentRow);
    }
  }

  if (parseRows.length === 0) return { headers: [], rows: [] };

  const headers = parseRows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < parseRows.length; i++) {
    const rawCells = parseRows[i];
    const rowObj: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      rowObj[header] = rawCells[colIdx] ?? '';
    });
    // Solo incluir si tiene al menos un valor no vacío
    if (Object.values(rowObj).some((v) => v.length > 0)) {
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}

/**
 * Parser de JSON que acepta array plano, formatos envueltos (data, catas, etc.) y exportaciones de Notion.
 */
export function parseJSON(content: string): { headers: string[]; rows: Record<string, any>[] } {
  const parsed = JSON.parse(content);
  let arrayData: any[] = [];

  if (Array.isArray(parsed)) {
    arrayData = parsed;
  } else if (parsed && typeof parsed === 'object') {
    // Si contiene una clave con la lista
    const candidateKey = ['catas', 'tastings', 'beers', 'cervezas', 'data', 'results', 'rows', 'items'].find(
      (k) => Array.isArray(parsed[k])
    );
    if (candidateKey) {
      arrayData = parsed[candidateKey];
    } else if (parsed.properties) {
      // Registro único de Notion
      arrayData = [parsed];
    } else {
      // Podría ser un diccionario indexado { "1": {...}, "2": {...} }
      const values = Object.values(parsed);
      if (values.length > 0 && typeof values[0] === 'object') {
        arrayData = values;
      }
    }
  }

  // Normalizar objetos de Notion si vienen con la estructura de bloques/propiedades
  const normalizedRows: Record<string, any>[] = arrayData.map((item) => {
    if (!item || typeof item !== 'object') return {};

    // Si es un objeto de Notion con .properties
    if (item.properties && typeof item.properties === 'object') {
      const flat: Record<string, any> = {};
      for (const [propName, propVal] of Object.entries(item.properties as Record<string, any>)) {
        if (!propVal || typeof propVal !== 'object') continue;
        const type = propVal.type;
        if (type === 'title' && Array.isArray(propVal.title)) {
          flat[propName] = propVal.title.map((t: any) => t.plain_text || '').join('');
        } else if (type === 'rich_text' && Array.isArray(propVal.rich_text)) {
          flat[propName] = propVal.rich_text.map((t: any) => t.plain_text || '').join('');
        } else if (type === 'number') {
          flat[propName] = propVal.number;
        } else if (type === 'select' && propVal.select) {
          flat[propName] = propVal.select.name;
        } else if (type === 'multi_select' && Array.isArray(propVal.multi_select)) {
          flat[propName] = propVal.multi_select.map((m: any) => m.name).join(', ');
        } else if (type === 'date' && propVal.date) {
          flat[propName] = propVal.date.start;
        } else if (type === 'url') {
          flat[propName] = propVal.url;
        } else {
          flat[propName] = propVal.name || propVal.value || JSON.stringify(propVal);
        }
      }
      return flat;
    }

    return item;
  });

  // Extraer todas las columnas posibles
  const headerSet = new Set<string>();
  normalizedRows.forEach((row) => {
    Object.keys(row).forEach((k) => headerSet.add(k));
  });

  return {
    headers: Array.from(headerSet),
    rows: normalizedRows,
  };
}

/**
 * Normaliza valores de números tolerando textos como "6.5%", "40 IBU", comas decimales "6,5".
 */
function parseCleanNumber(val: any, fallback: number): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number' && !isNaN(val)) return val;
  const str = String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

/**
 * Normaliza listas de descriptores a partir de strings o arrays.
 */
function parseDescriptors(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  const str = String(val);
  return str
    .split(/[,;|•\n]+/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

/**
 * Empareja el estilo contra la lista BJCP de forma inteligente.
 */
export function matchBJCPStyle(rawStyle?: string): string {
  if (!rawStyle || !rawStyle.trim()) return '21A. American IPA';
  const clean = rawStyle.trim();
  const lower = clean.toLowerCase();

  // Búsqueda exacta
  const exact = BJCP_STYLES.find(
    (s) =>
      `${s.code}. ${s.name}`.toLowerCase() === lower ||
      s.name.toLowerCase() === lower ||
      s.code.toLowerCase() === lower
  );
  if (exact) return `${exact.code}. ${exact.name}`;

  // Búsqueda por subcadena
  const partial = BJCP_STYLES.find(
    (s) =>
      lower.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(lower) ||
      (lower.startsWith(s.code.toLowerCase()) && s.code.length >= 2)
  );
  if (partial) return `${partial.code}. ${partial.name}`;

  return clean;
}

/**
 * Convierte las filas brutas del archivo en instancias completas de `BeerTasting` usando los mapeos.
 */
export function convertRowsToTastings(
  rows: Record<string, any>[],
  mappings: FieldMapping[]
): BeerTasting[] {
  const mapDict: Record<string, string> = {};
  mappings.forEach((m) => {
    if (m.targetField !== 'ignore') {
      mapDict[m.targetField] = m.sourceColumn;
    }
  });

  return rows
    .map((row, idx) => {
      const getVal = (targetField: string): any => {
        const sourceCol = mapDict[targetField];
        if (!sourceCol) return undefined;
        return row[sourceCol];
      };

      const rawName = getVal('name');
      const name = rawName ? String(rawName).trim() : `Cerveza Importada #${idx + 1}`;
      const brewery = getVal('brewery') ? String(getVal('brewery')).trim() : 'Artesana Desconocida';
      const style = matchBJCPStyle(getVal('style'));

      let abv = parseCleanNumber(getVal('abv'), 5.5);
      if (abv > 30) abv = abv / 10; // Caso por ejemplo 65 en lugar de 6.5
      abv = Math.round(abv * 10) / 10;

      const ibu = Math.round(parseCleanNumber(getVal('ibu'), 30));
      const srmVal = Math.round(parseCleanNumber(getVal('srm'), 8));
      const srm = srmVal > 40 ? 40 : srmVal < 1 ? 4 : srmVal;
      const ebc = srm * 2;

      // Puntuación 1 a 5
      let rawRating = parseCleanNumber(getVal('rating'), 4.0);
      if (rawRating > 5 && rawRating <= 10) {
        rawRating = rawRating / 2;
      } else if (rawRating > 10 && rawRating <= 100) {
        rawRating = (rawRating / 100) * 5;
      }
      const rating = Math.min(5, Math.max(1, Math.round(rawRating * 2) / 2));

      const country = getVal('country') ? String(getVal('country')).trim() : undefined;
      const notes = getVal('notes') ? String(getVal('notes')).trim() : 'Cata importada con éxito.';
      const pairing = getVal('pairing') ? String(getVal('pairing')).trim() : undefined;

      // Descriptores
      const aromaDescriptors = parseDescriptors(getVal('aromaDescriptors'));
      const saborDescriptors = parseDescriptors(getVal('saborDescriptors'));
      const otherDescriptors = parseDescriptors(getVal('otherDescriptors'));

      // Claridad: Cristalina, Velada, Opaco, Turbia, Transparente
      const rawClarity = String(getVal('clarity') || '').toLowerCase();
      let clarity: ClarityType = 'Cristalina';
      if (rawClarity.includes('turbi') || rawClarity.includes('hazy')) clarity = 'Turbia';
      else if (rawClarity.includes('vela')) clarity = 'Velada';
      else if (rawClarity.includes('opac')) clarity = 'Opaco';
      else if (rawClarity.includes('transparente')) clarity = 'Transparente';
      else if (rawClarity.includes('cristal')) clarity = 'Cristalina';
      else if (rawClarity.includes('brillant')) clarity = 'Cristalina';

      // Brillante
      const rawBrillante = String(getVal('brillante') || '').toLowerCase();
      let brillante: BrillanteType = 'Brillante';
      if (rawBrillante.includes('no') || rawBrillante.includes('false') || rawBrillante.includes('mate') || rawBrillante.includes('apagad')) {
        brillante = 'No Brillante';
      }

      // Espuma
      const rawFoam = String(getVal('foamType') || '').toLowerCase();
      let foamType: FoamType = 'Cremosa';
      if (rawFoam.includes('jabon')) foamType = 'Jabonosa';

      // Color Espuma: Blanca, Hueso, Beige, Marrón, Blanco Roto, Rosa
      const rawFoamColor = String(getVal('foamColor') || '').toLowerCase();
      let foamColor: FoamColorType = 'Blanca';
      if (rawFoamColor.includes('hueso') || rawFoamColor.includes('ivory')) foamColor = 'Hueso';
      else if (rawFoamColor.includes('beige')) foamColor = 'Beige';
      else if (rawFoamColor.includes('marr') || rawFoamColor.includes('brown')) foamColor = 'Marrón';
      else if (rawFoamColor.includes('roto') || rawFoamColor.includes('off white')) foamColor = 'Blanco Roto';
      else if (rawFoamColor.includes('rosa') || rawFoamColor.includes('pink')) foamColor = 'Rosa';

      // Adherencia Espuma: Baja, Media, Alta (array máx 2)
      const rawFoamAdherence = String(getVal('foamAdherence') || '').toLowerCase();
      const foamAdherence: FoamAdherenceType[] = [];
      if (rawFoamAdherence.includes('baja')) foamAdherence.push('Baja');
      if (rawFoamAdherence.includes('media')) foamAdherence.push('Media');
      if (rawFoamAdherence.includes('alta')) foamAdherence.push('Alta');
      if (foamAdherence.length === 0) foamAdherence.push('Media');

      // Persistencia Espuma: Baja, Media, Alta, Sin Espuma
      const rawPersistence = String(getVal('foamPersistence') || '').toLowerCase();
      let foamPersistence: FoamPersistenceType = 'Media';
      if (rawPersistence.includes('sin') || rawPersistence.includes('cero') || rawPersistence.includes('none')) foamPersistence = 'Sin Espuma';
      else if (rawPersistence.includes('baja') || rawPersistence.includes('fugaz')) foamPersistence = 'Baja';
      else if (rawPersistence.includes('alta') || rawPersistence.includes('persistente')) foamPersistence = 'Alta';

      // Carbonatación
      const rawCarbonation = String(getVal('carbonation') || '').toLowerCase();
      let carbonation: CarbonationType = 'Media';
      if (rawCarbonation.includes('alt') || rawCarbonation.includes('high')) carbonation = 'Alta';
      else if (rawCarbonation.includes('baj') || rawCarbonation.includes('low')) carbonation = 'Baja';

      // Radar aroma
      const aromaRadar: AromaRadarValues = {
        dulce: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('aromaRadarDulce'), 2)))),
        amargo: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('aromaRadarAmargo'), 2)))),
        acido: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('aromaRadarAcido'), 1)))),
        lupulo: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('aromaRadarLupulo'), 3)))),
        malta: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('aromaRadarMalta'), 2)))),
      };

      // Radar sabor
      const saborRadar: SaborRadarValues = {
        dulce: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('saborRadarDulce'), 2)))),
        amargo: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('saborRadarAmargo'), 3)))),
        seco: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('saborRadarSeco'), 2)))),
        acido: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('saborRadarAcido'), 1)))),
        fusel: Math.min(5, Math.max(0, Math.round(parseCleanNumber(getVal('saborRadarFusel'), 1)))),
      };

      // Imagen
      const rawImg = getVal('imageUrl');
      const fallbackPhoto = PRESET_FALLBACK_PHOTOS[idx % PRESET_FALLBACK_PHOTOS.length];
      const imageUrl = rawImg && typeof rawImg === 'string' && rawImg.startsWith('http')
        ? rawImg.trim()
        : fallbackPhoto;

      // Fecha
      const rawDate = getVal('createdAt');
      let createdAt = new Date().toISOString().split('T')[0];
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          createdAt = d.toISOString().split('T')[0];
        }
      }

      const tastingId = `import_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`;

      const tasting: BeerTasting = {
        id: tastingId,
        name,
        brewery,
        country,
        abv,
        style,
        ibu,
        ebc,
        srm,
        clarity,
        brillante,
        foamType,
        foamColor,
        foamAdherence,
        foamPersistence,
        carbonation,
        rating,
        notes,
        pairing,
        aromaDescriptors: aromaDescriptors.length > 0 ? aromaDescriptors : ['Cítrico', 'Lupulado'],
        saborDescriptors: saborDescriptors.length > 0 ? saborDescriptors : ['Equilibrado', 'Malta'],
        otherDescriptors: otherDescriptors,
        aromaRadar,
        saborRadar,
        radarValues: {
          hop: aromaRadar.lupulo,
          malt: aromaRadar.malta,
          bitterness: saborRadar.amargo,
          sweetness: saborRadar.dulce,
        },
        imageUrl,
        images: [imageUrl],
        createdAt,
      };

      return tasting;
    })
    .filter((t) => t.name && t.name.length > 0);
}

/**
 * Lee un archivo .csv o .json del usuario y produce el resultado analizado con mapeos sugeridos.
 */
export async function processImportFile(file: File): Promise<ParsedDatabaseResult> {
  const content = await file.text();
  const lowerName = file.name.toLowerCase();

  let isJson = lowerName.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[');
  let headers: string[] = [];
  let rows: Record<string, any>[] = [];

  if (isJson) {
    try {
      const res = parseJSON(content);
      headers = res.headers;
      rows = res.rows;
    } catch (e: any) {
      // Si falló parseJSON, intentamos como CSV por si acaso
      const res = parseCSV(content);
      headers = res.headers;
      rows = res.rows;
      isJson = false;
    }
  } else {
    const res = parseCSV(content);
    headers = res.headers;
    rows = res.rows;
  }

  if (headers.length === 0 || rows.length === 0) {
    throw new Error('El archivo seleccionado está vacío o no contiene registros válidos.');
  }

  const suggestedMappings = analyzeColumns(headers);
  const previewTastings = convertRowsToTastings(rows.slice(0, 3), suggestedMappings);

  return {
    fileName: file.name,
    fileType: isJson ? 'json' : 'csv',
    totalRows: rows.length,
    availableColumns: headers,
    suggestedMappings,
    rawRows: rows,
    previewTastings,
  };
}

export const SAMPLE_NOTION_CSV = `Nombre Cerveza,Cervecería,Estilo,Graduación ABV,Amargor IBU,Puntuación,País,Notas de Cata,Maridaje
Punk IPA,BrewDog,American IPA,5.4,35,4.5,Escocia,"Explosión de lúpulo cítrico con notas a pomelo, piña y resina de pino.",Hamburguesa gourmet con queso azul
Alhambra Reserva 1925,Cervezas Alhambra,Strong European Beer / Bock,6.4,25,4.8,España,"Intensa y profunda, cuerpo sedoso con notas de malta tostada y caramelo.",Carnes a la brasa y quesos curados
Duvel,Duvel Moortgat,Belgian Strong Golden Ale,8.5,33,4.7,Bélgica,"Efervescente y seca, espuma cremosa inagotable, aromas a pera y pimienta.",Mariscos y mejillones al vapor
Guinness Draught,Guinness,Irish Extra Stout,4.2,45,4.2,Irlanda,"Cremosa, aterciopelada con notas intensas de café torrefacto y chocolate negro.",Ostras frescas y estofado irlandés`;
