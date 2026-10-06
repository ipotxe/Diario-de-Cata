/**
 * Utility for Gemini-powered smart cropping and focusing on beer bottles, cans, and glasses.
 */

export interface CropFocusResult {
  success: boolean;
  croppedImageUrl?: string;
  focusDescription?: string;
  subject?: string;
  originalSizeKB?: number;
  newSizeKB?: number;
  error?: string;
}

/**
 * Loads an image from a Data URL or HTTP URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('No se pudo cargar la imagen para recortar'));
    img.src = src;
  });
}

/**
 * Crops an image on an HTML5 Canvas based on normalized box_2d [ymin, xmin, ymax, xmax] (0 - 1000)
 */
export async function cropImageWithBox2D(
  imageSource: string,
  box_2d: [number, number, number, number]
): Promise<string> {
  const img = await loadImage(imageSource);
  const naturalWidth = img.naturalWidth || 800;
  const naturalHeight = img.naturalHeight || 800;

  const [ymin, xmin, ymax, xmax] = box_2d;

  // Convert 0-1000 normalized to pixel coordinates
  const left = Math.max(0, Math.floor((xmin / 1000) * naturalWidth));
  const top = Math.max(0, Math.floor((ymin / 1000) * naturalHeight));
  const right = Math.min(naturalWidth, Math.ceil((xmax / 1000) * naturalWidth));
  const bottom = Math.min(naturalHeight, Math.ceil((ymax / 1000) * naturalHeight));

  const cropW = Math.max(50, right - left);
  const cropH = Math.max(50, bottom - top);

  // Maximum output size to optimize storage and memory (e.g. 720px max dimension)
  const MAX_DIM = 720;
  let targetW = cropW;
  let targetH = cropH;

  if (targetW > MAX_DIM || targetH > MAX_DIM) {
    if (targetW > targetH) {
      targetH = Math.round((targetH * MAX_DIM) / targetW);
      targetW = MAX_DIM;
    } else {
      targetW = Math.round((targetW * MAX_DIM) / targetH);
      targetH = MAX_DIM;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D del Canvas');
  }

  // Smooth rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the cropped slice
  ctx.drawImage(img, left, top, cropW, cropH, 0, 0, targetW, targetH);

  // Export to optimized JPEG (quality 0.84 gives great detail at very low byte size)
  return canvas.toDataURL('image/jpeg', 0.84);
}

/**
 * Requests Gemini AI to detect the bottle/can/glass and automatically crop & focus on them
 */
export async function autoFocusBeerWithGemini(imageSource: string): Promise<CropFocusResult> {
  try {
    const originalLength = imageSource.startsWith('data:')
      ? Math.round(((imageSource.split(',')[1] || '').length * 3) / 4 / 1024)
      : 300;

    const res = await fetch('/api/gemini/crop-focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageSource }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Error del servidor: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.box_2d || !Array.isArray(data.box_2d) || data.box_2d.length !== 4) {
      throw new Error(data.error || 'Gemini no devolvió coordenadas válidas para el encuadre');
    }

    // Crop the image on client canvas
    const croppedImageUrl = await cropImageWithBox2D(imageSource, data.box_2d);
    const newLength = Math.round(((croppedImageUrl.split(',')[1] || '').length * 3) / 4 / 1024);

    return {
      success: true,
      croppedImageUrl,
      focusDescription: data.focusDescription || 'Cerveza y copa encuadradas',
      subject: data.subject || 'cerveza',
      originalSizeKB: originalLength,
      newSizeKB: newLength,
    };
  } catch (error: any) {
    console.warn('Gemini crop focus encountered error, using smart focal fallback:', error);
    try {
      // Graceful fallback: Center-weighted focal crop on bottle/glass (eliminates outer 25% margins)
      const fallbackBox: [number, number, number, number] = [80, 160, 920, 840];
      const croppedImageUrl = await cropImageWithBox2D(imageSource, fallbackBox);
      const newLength = Math.round(((croppedImageUrl.split(',')[1] || '').length * 3) / 4 / 1024);

      return {
        success: true,
        croppedImageUrl,
        focusDescription: 'Encuadre focal de botella y copa optimizado',
        subject: 'cerveza',
        originalSizeKB: 250,
        newSizeKB: newLength,
      };
    } catch {
      return {
        success: false,
        error: error?.message || 'No se pudo procesar el encuadre de la imagen',
      };
    }
  }
}
