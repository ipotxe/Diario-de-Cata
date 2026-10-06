import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '15mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Detección inteligente de encuadre (lata, botella, botellín y copa) con Gemini
app.post('/api/gemini/crop-focus', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Se requiere una imagen en base64 o URL' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = '';

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = image.split(',')[1] || image;
      }
    } else if (image.startsWith('http://') || image.startsWith('https://')) {
      const imgRes = await fetch(image);
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString('base64');
      const contentType = imgRes.headers.get('content-type');
      if (contentType) mimeType = contentType;
    } else {
      base64Data = image;
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: `Eres un sommelier cervecero y asistente de visión artificial de alta precisión.
Tu misión es identificar los elementos clave de la cata en esta fotografía:
1. La lata de cerveza, botella o botellín.
2. La copa o vaso servido con la cerveza y su espuma (giste / corona).
3. Si aparecen ambos (botella/lata Y copa/vaso), encuadra AMBOS conjuntamente.
4. Si solo aparece uno de ellos, encuadra ese elemento con su silueta completa.
5. Descarta fondos innecesarios, personas, mesas vacías o espacio sobrante.

Genera una caja delimitadora (bounding box) ajustada [ymin, xmin, ymax, xmax] en coordenadas normalizadas del 0 al 1000 que encuadre perfectamente la lata, botella o botellín y la copa, añadiendo un margen de seguridad de aproximadamente 3% a 5% para que no se corte la espuma ni el cuello o chapa.

Responde ÚNICAMENTE en JSON con la siguiente estructura:
{
  "detected": true,
  "subject": "botella" | "lata" | "copa" | "botella_y_copa" | "lata_y_copa" | "cerveza",
  "box_2d": [ymin, xmin, ymax, xmax],
  "focusDescription": "Descripción concisa en español (ej: Botellín de cerveza artesanal y copa de degustación con espuma)"
}`,
    };

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini crop-focus] ${modelName} call failed, trying fallback...`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No se pudo analizar la imagen con los modelos Gemini');
    }

    const parsed = JSON.parse(responseText);
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Error al detectar enfoque de cerveza con Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error al procesar la imagen con Gemini',
    });
  }
});

// Endpoint: Contrastar y mapear campos de base de datos con Gemini
app.post('/api/gemini/analyze-columns', async (req, res) => {
  try {
    const { headers, sampleRows } = req.body;
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({ success: false, error: 'Se requiere un array de headers' });
    }

    const prompt = `Eres un sommelier cervecero y experto en normalización de bases de datos.
El usuario quiere importar un archivo (.csv o .json) de catas de cerveza a la aplicación "Diario del Cervecero".

Columnas recibidas en el archivo:
${JSON.stringify(headers)}

Muestras de filas de datos (primeros registros para que veas el formato y contenido real de cada columna):
${JSON.stringify(sampleRows || [])}

Necesitas emparejar cada columna recibida con uno de los siguientes campos permitidos del esquema de catas de "Diario del Cervecero":
- "name": Nombre de la cerveza (marca, título comercial).
- "brewery": Cervecera, fábrica, marca o productor.
- "style": Estilo cervecero (ej: BJCP, IPA, Stout, Pilsner, Porter, etc.).
- "abv": Graduación alcohólica en % (ej: 5.5, 6.2%).
- "ibu": Unidades de amargor IBU.
- "srm": Color SRM o EBC.
- "rating": Puntuación o valoración (puede estar en escala 1-5, 1-10 o 1-100).
- "notes": Notas de cata, descripción o comentarios de opinión.
- "country": País o región de origen.
- "pairing": Maridaje con comidas sugerido.
- "aromaDescriptors": Descriptores o notas de aroma.
- "saborDescriptors": Descriptores o notas en boca / sabor.
- "clarity": Claridad / apariencia ('Brillante', 'Velada', 'Turbia').
- "foamType": Espuma ('Persistente', 'Fugaz', 'Cremosa', 'Jabonosa').
- "carbonation": Carbonatación ('Baja', 'Media', 'Alta').
- "createdAt": Fecha de registro de la cata (ISO, YYYY-MM-DD, etc.).
- "ignore": Si es un ID interno, enlace web irrelevante, marca de tiempo de sincronización o dato no útil.

Responde ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "detectedSource": "Nombre inferido de la fuente (ej: Notion Beer Database, Untappd Export, Excel casero, RateBeer, etc.)",
  "summary": "Breve explicación en español del contraste realizado y cómo se mapearon los datos.",
  "mappings": [
    {
      "sourceColumn": "nombre de la columna original tal como viene",
      "targetField": "campo_del_esquema o ignore",
      "confidence": "high" | "medium" | "low",
      "notes": "explicación de la correspondencia basada en las muestras"
    }
  ]
}`;

    let responseText = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] ${modelName} call failed, trying fallback model...`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No se pudo generar respuesta con los modelos Gemini');
    }

    const parsed = JSON.parse(responseText);
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Error al contrastar columnas con Gemini:', error);
    return res.json({
      success: false,
      fallback: true,
      error: error?.message || 'Error al conectar con el servicio de IA',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
