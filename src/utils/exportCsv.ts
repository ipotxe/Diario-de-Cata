import { BeerTasting } from '../types';

/**
 * Generates and triggers the download of a UTF-8 CSV containing all beer tastings data.
 */
export function exportTastingsToCsv(tastings: BeerTasting[]): void {
  const headers = [
    'ID',
    'Nombre Cerveza',
    'Cervecería',
    'País de Origen',
    'Estilo BJCP',
    'Graduación Alcohólica ABV (%)',
    'Amargor IBU',
    'Color EBC',
    'Color SRM',
    'Claridad',
    'Tipo de Espuma',
    'Carbonatación',
    'Puntuación (1-5)',
    'Aroma: Dulce (0-5)',
    'Aroma: Amargo (0-5)',
    'Aroma: Ácido (0-5)',
    'Aroma: Lúpulo (0-5)',
    'Aroma: Malta (0-5)',
    'Descriptores de Aroma',
    'Sabor: Dulce (0-5)',
    'Sabor: Amargo (0-5)',
    'Sabor: Seco (0-5)',
    'Sabor: Ácido (0-5)',
    'Sabor: Fusel (0-5)',
    'Descriptores de Sabor',
    'Otros Descriptores',
    'Maridaje Sugerido',
    'Notas de Cata',
    'URL Imagen',
    'Fecha de Registro',
  ];

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = tastings.map((t) => {
    const aroma = t.aromaRadar || {
      dulce: t.radarValues?.sweetness ?? '',
      amargo: t.radarValues?.bitterness ?? '',
      acido: '',
      lupulo: t.radarValues?.hop ?? '',
      malta: t.radarValues?.malt ?? '',
    };

    const sabor = t.saborRadar || {
      dulce: t.radarValues?.sweetness ?? '',
      amargo: t.radarValues?.bitterness ?? '',
      seco: '',
      acido: '',
      fusel: '',
    };

    const aromaDesc = Array.isArray(t.aromaDescriptors) ? t.aromaDescriptors.join('; ') : '';
    const saborDesc = Array.isArray(t.saborDescriptors) && t.saborDescriptors.length > 0
      ? t.saborDescriptors.join('; ')
      : Array.isArray(t.otherDescriptors)
      ? t.otherDescriptors.join('; ')
      : '';
    const otherDesc = Array.isArray(t.otherDescriptors) ? t.otherDescriptors.join('; ') : '';

    return [
      escapeCsv(t.id),
      escapeCsv(t.name),
      escapeCsv(t.brewery),
      escapeCsv(t.country || ''),
      escapeCsv(t.style),
      escapeCsv(t.abv),
      escapeCsv(t.ibu),
      escapeCsv(t.ebc),
      escapeCsv(t.srm),
      escapeCsv(t.clarity),
      escapeCsv(t.foamType),
      escapeCsv(t.carbonation),
      escapeCsv(t.rating),
      escapeCsv(aroma.dulce),
      escapeCsv(aroma.amargo),
      escapeCsv(aroma.acido),
      escapeCsv(aroma.lupulo),
      escapeCsv(aroma.malta),
      escapeCsv(aromaDesc),
      escapeCsv(sabor.dulce),
      escapeCsv(sabor.amargo),
      escapeCsv(sabor.seco),
      escapeCsv(sabor.acido),
      escapeCsv(sabor.fusel),
      escapeCsv(saborDesc),
      escapeCsv(otherDesc),
      escapeCsv(t.pairing || ''),
      escapeCsv(t.notes || ''),
      escapeCsv(t.imageUrl || ''),
      escapeCsv(t.createdAt || ''),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel / Google Sheets compatibility with special chars and accents
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `base_de_datos_catas_${dateStr}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}
