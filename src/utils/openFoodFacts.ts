import { BJCP_STYLES } from '../data/bjcpStyles';

export interface ScannedBeerData {
  found: boolean;
  barcode: string;
  name?: string;
  brewery?: string;
  country?: string;
  abv?: number;
  ibu?: number;
  ebc?: number;
  srm?: number;
  style?: string;
  imageUrl?: string;
  rawCategories?: string;
  errorMessage?: string;
}

const COUNTRY_MAP: Record<string, string> = {
  'spain': 'España',
  'españa': 'España',
  'espana': 'España',
  'es': 'España',
  'belgium': 'Bélgica',
  'bélgica': 'Bélgica',
  'belgique': 'Bélgica',
  'be': 'Bélgica',
  'germany': 'Alemania',
  'alemania': 'Alemania',
  'deutschland': 'Alemania',
  'de': 'Alemania',
  'united kingdom': 'Reino Unido',
  'united-kingdom': 'Reino Unido',
  'reino unido': 'Reino Unido',
  'great britain': 'Reino Unido',
  'england': 'Reino Unido',
  'scotland': 'Reino Unido',
  'uk': 'Reino Unido',
  'gb': 'Reino Unido',
  'united states': 'EE.UU.',
  'united-states': 'EE.UU.',
  'estados unidos': 'EE.UU.',
  'usa': 'EE.UU.',
  'us': 'EE.UU.',
  'mexico': 'México',
  'méxico': 'México',
  'mx': 'México',
  'france': 'Francia',
  'francia': 'Francia',
  'fr': 'Francia',
  'ireland': 'Irlanda',
  'irlanda': 'Irlanda',
  'ie': 'Irlanda',
  'czech republic': 'República Checa',
  'czech-republic': 'República Checa',
  'czechia': 'República Checa',
  'república checa': 'República Checa',
  'cz': 'República Checa',
  'italy': 'Italia',
  'italia': 'Italia',
  'it': 'Italia',
  'netherlands': 'Países Bajos',
  'holanda': 'Países Bajos',
  'países bajos': 'Países Bajos',
  'paises bajos': 'Países Bajos',
  'nl': 'Países Bajos',
  'denmark': 'Dinamarca',
  'dinamarca': 'Dinamarca',
  'dk': 'Dinamarca',
  'sweden': 'Suecia',
  'suecia': 'Suecia',
  'se': 'Suecia',
  'norway': 'Noruega',
  'noruega': 'Noruega',
  'no': 'Noruega',
  'austria': 'Austria',
  'at': 'Austria',
  'japan': 'Japón',
  'japón': 'Japón',
  'jp': 'Japón',
  'argentina': 'Argentina',
  'ar': 'Argentina',
  'chile': 'Chile',
  'cl': 'Chile',
  'portugal': 'Portugal',
  'pt': 'Portugal',
  'poland': 'Polonia',
  'polonia': 'Polonia',
  'pl': 'Polonia',
  'canada': 'Canadá',
  'canadá': 'Canadá',
  'ca': 'Canadá',
};

/**
 * Normaliza y comprueba de forma estricta un país de origen.
 * Solo se aceptan coincidencias exactas o bien definidas, nunca países de venta.
 */
function parseStrictCountry(val: string): string | undefined {
  if (!val) return undefined;
  const clean = val
    .toLowerCase()
    .replace(/^en:/, '')
    .replace(/^es:/, '')
    .replace(/^fr:/, '')
    .replace(/-/g, ' ')
    .trim();

  if (COUNTRY_MAP[clean]) {
    return COUNTRY_MAP[clean];
  }

  // Comprobar coincidencia exacta por palabra
  for (const [key, name] of Object.entries(COUNTRY_MAP)) {
    if (clean === key) {
      return name;
    }
  }

  return undefined;
}

/**
 * Extrae el país de origen ÚNICAMENTE si está estrictamente confirmado en campos de fabricación u origen.
 * IMPORTANTE: No utiliza `countries` ni `countries_tags` porque Open Food Facts almacena ahí los países
 * donde se comercializa/vende el producto, lo cual genera falsos positivos (ej. cerveza belga vendida en España).
 */
function extractStrictOriginCountry(product: any): string | undefined {
  // 1. Origen explícito en origins / origins_tags / origins_hierarchy
  const originsList = [
    product.origins_tags,
    product.origins_hierarchy,
    product.origins,
  ];

  for (const origin of originsList) {
    if (!origin) continue;
    const items = Array.isArray(origin) ? origin : [origin];
    for (const item of items) {
      if (typeof item === 'string') {
        const parts = item.split(',');
        for (const part of parts) {
          const matched = parseStrictCountry(part);
          if (matched) return matched;
        }
      }
    }
  }

  // 2. Lugares de fabricación / envasado (manufacturing_places)
  const mfgList = [
    product.manufacturing_places_tags,
    product.manufacturing_places,
  ];

  for (const mfg of mfgList) {
    if (!mfg) continue;
    const items = Array.isArray(mfg) ? mfg : [mfg];
    for (const item of items) {
      if (typeof item === 'string') {
        const parts = item.split(',');
        for (const part of parts) {
          const matched = parseStrictCountry(part);
          if (matched) return matched;
        }
      }
    }
  }

  // 3. Verificación por texto explícito de fabricación ("Elaborado en...", "Brewed in...", "Fabricado en...")
  const textsToCheck = [
    product.labels,
    product.generic_name,
    product.generic_name_es,
    product.ingredients_text,
    product.ingredients_text_es,
  ].filter(Boolean).join(' ');

  const originRegex = /(?:elaborad[ao]|fabricad[ao]|producid[ao]|hech[ao]|brewed|produced)\s+(?:en|in|de|by)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/i;
  const match = textsToCheck.match(originRegex);
  if (match && match[1]) {
    const rawTarget = match[1].slice(0, 30).trim();
    const matched = parseStrictCountry(rawTarget);
    if (matched) return matched;
  }

  // Si no está 100% confirmado el origen, no asumir nada y devolver undefined
  return undefined;
}

function extractABV(product: any): number | undefined {
  if (product.nutriments) {
    if (typeof product.nutriments.alcohol === 'number' && product.nutriments.alcohol > 0) {
      return Number(product.nutriments.alcohol.toFixed(1));
    }
    if (typeof product.nutriments.alcohol_100g === 'number' && product.nutriments.alcohol_100g > 0) {
      return Number(product.nutriments.alcohol_100g.toFixed(1));
    }
    if (typeof product.nutriments.alcohol_value === 'number' && product.nutriments.alcohol_value > 0) {
      return Number(product.nutriments.alcohol_value.toFixed(1));
    }
  }

  // Regex on text fields
  const texts = [
    product.product_name,
    product.product_name_es,
    product.generic_name,
    product.generic_name_es,
    product.quantity,
    product.ingredients_text,
  ].filter(Boolean).join(' ');

  const match = texts.match(/(\d+([.,]\d+)?)\s*%\s*(vol|alc)?/i);
  if (match) {
    const num = parseFloat(match[1].replace(',', '.'));
    if (!isNaN(num) && num > 0 && num <= 30) {
      return Number(num.toFixed(1));
    }
  }

  return undefined;
}

function extractIBU(text: string): number | undefined {
  const match = text.match(/(?:IBU|ibu|amargor)[:\s]*(\d+)/i) || text.match(/(\d+)\s*(?:IBU|ibu)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val >= 0 && val <= 200) {
      return val;
    }
  }
  return undefined;
}

function extractEBC(text: string): number | undefined {
  const match = text.match(/(?:EBC|ebc)[:\s]*(\d+)/i) || text.match(/(\d+)\s*(?:EBC|ebc)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val >= 0 && val <= 140) {
      return val;
    }
  }
  return undefined;
}

/**
 * Detección estricta de Estilo BJCP.
 * Solo se asigna si el nombre del producto o sus etiquetas oficiales contienen
 * la denominación técnica exacta o código de la guía BJCP. No se usan heurísticas
 * genéricas para evitar clasificaciones erróneas.
 */
function detectStrictBJCPStyle(productName: string, productData: any): string | undefined {
  const textToEvaluate = `${productName} ${productData.generic_name || ''} ${productData.generic_name_es || ''}`.toLowerCase();

  // 1. Comprobar si incluye el código exacto BJCP (ej: "21A", "22A", "25B")
  for (const style of BJCP_STYLES) {
    const codePattern = new RegExp(`\\b${style.code}\\b`, 'i');
    if (codePattern.test(textToEvaluate)) {
      return `${style.code}. ${style.name}`;
    }
  }

  // 2. Comprobar nombres muy específicos e inequívocos de la guía BJCP
  const EXACT_UNAMBIGUOUS_STYLES: Array<{ namePattern: RegExp; code: string }> = [
    { namePattern: /\b(double ipa|imperial ipa|dipa)\b/i, code: '22A' },
    { namePattern: /\b(neipa|new england ipa|hazy ipa)\b/i, code: '21B' },
    { namePattern: /\b(black ipa|cascadian dark ale)\b/i, code: '21B' },
    { namePattern: /\b(russian imperial stout|imperial stout)\b/i, code: '20C' },
    { namePattern: /\b(oatmeal stout)\b/i, code: '16B' },
    { namePattern: /\b(milk stout|sweet stout)\b/i, code: '16A' },
    { namePattern: /\b(baltic porter)\b/i, code: '9C' },
    { namePattern: /\b(belgian tripel|tripel belga)\b/i, code: '26C' },
    { namePattern: /\b(belgian dubbel|dubbel belga)\b/i, code: '26B' },
    { namePattern: /\b(belgian blond ale|rubia belga)\b/i, code: '25A' },
    { namePattern: /\b(hefeweizen|weizenbier|weissbier)\b/i, code: '10A' },
    { namePattern: /\b(dunkelweizen)\b/i, code: '10B' },
    { namePattern: /\b(weizenbock)\b/i, code: '10C' },
    { namePattern: /\b(berliner weisse)\b/i, code: '10C' },
    { namePattern: /\b(munich dunkel)\b/i, code: '8A' },
    { namePattern: /\b(schwarzbier)\b/i, code: '8B' },
    { namePattern: /\b(vienna lager)\b/i, code: '7A' },
    { namePattern: /\b(munich helles)\b/i, code: '4A' },
    { namePattern: /\b(czech premium pale lager|bohemian pilsner)\b/i, code: '3B' },
    { namePattern: /\b(german pils|pils alemana)\b/i, code: '5D' },
    { namePattern: /\b(doppelbock)\b/i, code: '9A' },
    { namePattern: /\b(eisbock)\b/i, code: '9B' },
    { namePattern: /\b(gose)\b/i, code: '27A' },
    { namePattern: /\b(gueuze|geuze)\b/i, code: '23D' },
    { namePattern: /\b(flanders red ale)\b/i, code: '23B' },
  ];

  for (const item of EXACT_UNAMBIGUOUS_STYLES) {
    if (item.namePattern.test(textToEvaluate)) {
      const found = BJCP_STYLES.find((s) => s.code === item.code);
      if (found) return `${found.code}. ${found.name}`;
    }
  }

  // Si no hay confirmación estricta, devolvemos undefined para que el usuario elija el estilo exacto
  return undefined;
}

/**
 * Consulta la base de datos de Open Food Facts para obtener la información de una cerveza por su código de barras.
 */
export async function fetchBeerFromOpenFoodFacts(barcode: string): Promise<ScannedBeerData> {
  const cleanBarcode = barcode.trim().replace(/\D/g, '');
  if (!cleanBarcode || cleanBarcode.length < 5) {
    return {
      found: false,
      barcode,
      errorMessage: 'El código de barras no tiene un formato numérico válido.',
    };
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          found: false,
          barcode: cleanBarcode,
          errorMessage: 'Cerveza no encontrada en Open Food Facts.',
        };
      }
      return {
        found: false,
        barcode: cleanBarcode,
        errorMessage: `Error al consultar la base de datos (${response.status}).`,
      };
    }

    const data = await response.json();
    if (!data || data.status === 0 || !data.product) {
      return {
        found: false,
        barcode: cleanBarcode,
        errorMessage: 'Esta cerveza no se encuentra registrada en la base de datos de Open Food Facts.',
      };
    }

    const p = data.product;

    // 1. Name
    const name =
      p.product_name_es ||
      p.product_name ||
      p.generic_name_es ||
      p.generic_name ||
      p.product_name_en ||
      '';

    // 2. Brewery
    let brewery = p.brands || p.brand_owner || '';
    if (brewery.includes(',')) {
      brewery = brewery.split(',')[0].trim();
    }

    // 3. Country (Strict extraction: only confirmed origin/manufacturing, never country of sale)
    const country = extractStrictOriginCountry(p);

    // Combined text for metric extraction
    const combinedText = [
      name,
      brewery,
      p.generic_name,
      p.generic_name_es,
      p.categories,
      p.labels,
      p.ingredients_text,
      p.ingredients_text_es,
    ].filter(Boolean).join(' ');

    // 4. ABV
    const abv = extractABV(p);

    // 5. IBU & EBC
    const ibu = extractIBU(combinedText);
    const ebc = extractEBC(combinedText);
    const srm = ebc ? Math.max(1, Math.min(40, Math.round(ebc * 0.508))) : undefined;

    // 6. Style BJCP (Strict extraction: only confirmed unequivocal styles)
    const style = detectStrictBJCPStyle(name, p);

    // 7. Image
    const imageUrl =
      p.image_front_url ||
      p.image_url ||
      p.image_front_small_url ||
      p.image_small_url;

    return {
      found: true,
      barcode: cleanBarcode,
      name: name.trim() || undefined,
      brewery: brewery.trim() || undefined,
      country: country || undefined,
      abv,
      ibu,
      ebc,
      srm,
      style,
      imageUrl,
      rawCategories: p.categories || undefined,
    };
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return {
      found: false,
      barcode: cleanBarcode,
      errorMessage: 'Hubo un error de conexión al consultar Open Food Facts. Comprueba tu conexión a internet.',
    };
  }
}

