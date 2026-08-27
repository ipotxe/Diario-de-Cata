import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BeerTasting,
  ClarityType,
  FoamType,
  CarbonationType,
  RadarValues,
  AromaRadarValues,
  SaborRadarValues,
} from '../types';
import { SRMSlider } from './SRMSlider';
import { Radar5Chart, Radar5Axis } from './Radar5Chart';
import { DescriptorSelector } from './DescriptorSelector';
import {
  COMMON_AROMA_DESCRIPTORS,
  COMMON_SABOR_DESCRIPTORS,
} from '../data/sensoryDescriptors';
import { INITIAL_TASTINGS } from '../data/initialData';
import { BJCP_STYLES, BJCP_CATEGORY_GROUPS, getBJCPStyleLabel } from '../data/bjcpStyles';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ScannedBeerData } from '../utils/openFoodFacts';

interface NuevaCataViewProps {
  onSave: (cata: BeerTasting) => void;
  onCancel: () => void;
  editingCata?: BeerTasting | null;
}

const PRESET_PHOTOS = [
  {
    name: 'Hazy IPA',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC_9PJePcFLLcmRE6sUfky3cjo9U1uS6kSCsEq92ZLKF91Wi_6oV82C_vygjZ-Pl9n7lHja7CgD1rPvD_Jrzo9wOxw76iCEMsjFSKcxPTEtgTTNMW4q91IXep0-l9WM_oLiFwKsvxTEoYY6egS5Wq27u459SEjfmVutKeDlkWamGBR5k73CPM1ehNquhO09SdS8l6nfcWCXcUyGfEM4CcbXlxc8QxOTAm4XkwiOkBuSh0fPiE8uOCB4A',
  },
  {
    name: 'Imperial Stout',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVYqD1Yx-hlakQo0vx37q1DneDT056e_yoV-BF2DOp-R7cLjILHwV_jPT4pEWawzLf-elnsaEA1U2YUt8DLiGAMzgZZTzmepUEN7toemTB-7iOx4rXzOQ23doYWTFTZD4v-yjytSPfSaBSV3GsfNUq9Rf4hTqXtq6eDS-InyINXer76oVFH99TkxF2WvHYpBffiVWQIL_t1PUBWjM4HqUw7AUBOcOHc0sKOnmodFXJJiqatyb-wROffw',
  },
  {
    name: 'Fruited Sour',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvQ3cdSj1fb1-P0_IZjX19_KXMd0YrFiT7xMzNd89SCso-1ufx6s_Lg_Zj07ZvyB0aMeykZGcv29gUSK0eS99qtnCiadS2Ili0RKWm62AEDFTNjR2aCzHIli8w5_vV6WgonWVTD_H8Cg7lcwD3-I6r-CK_vYLbEIK4Ekpb7y8J7NVFN8jhrvktBToq76h1VdSolMJnlSJhGuxG8DY1tUMpEttJDEeMM0nWFDC-_wme6PNytix8GRUGgA',
  },
  {
    name: 'Golden Lager',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ7aJlCxcIADr_j5ceS6PBqb7STnIcPyi70BHDDqIF6UZG5aQ9X7Q1EwEqw8OKRiPr7yjVC2t6_oa2LjWWnvQ3ZT4xGhFetoOTMoL1IC_lK9kvjoaNCKqK8_AaPV6yKjvOjoO1ZksF7QOgPvZEjfcPQH_2U0kPT6qlVaALpgNpELmi5k3MYEX8ITwBLkMpJMvh9o0BZDroPNIolWpAdAYI-zEaXWxSxRbY5dFbOmOLb8eJv06N5QCzxA',
  },
];

const normalizeBJCPStyle = (rawStyle?: string): string => {
  if (!rawStyle) return '21A. American IPA';
  const foundExact = BJCP_STYLES.find(
    (s) =>
      `${s.code}. ${s.name}`.toLowerCase() === rawStyle.toLowerCase() ||
      s.name.toLowerCase() === rawStyle.toLowerCase() ||
      s.code.toLowerCase() === rawStyle.toLowerCase()
  );
  if (foundExact) return `${foundExact.code}. ${foundExact.name}`;

  const foundPartial = BJCP_STYLES.find(
    (s) =>
      rawStyle.toLowerCase().includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(rawStyle.toLowerCase())
  );
  if (foundPartial) return `${foundPartial.code}. ${foundPartial.name}`;
  return rawStyle;
};

export const NuevaCataView: React.FC<NuevaCataViewProps> = ({
  onSave,
  onCancel,
  editingCata,
}) => {
  const [name, setName] = useState('');
  const [brewery, setBrewery] = useState('');
  const [country, setCountry] = useState('');
  const [abv, setAbv] = useState<number | ''>(6.5);
  const [style, setStyle] = useState('21A. American IPA');
  const [styleSearch, setStyleSearch] = useState('');
  const [ibu, setIbu] = useState<number | ''>(40);
  const [ebc, setEbc] = useState<number | ''>(12);
  const [srm, setSrm] = useState(4);

  const [clarity, setClarity] = useState<ClarityType>('Brillante');
  const [foamType, setFoamType] = useState<FoamType>('Persistente');
  const [carbonation, setCarbonation] = useState<CarbonationType>('Media');

  const [sensoryViewTab, setSensoryViewTab] = useState<'aroma' | 'sabor' | 'ambos'>('ambos');

  // Aroma Radar state (Dulce, Amargo, Ácido, Lúpulo, Malta) - Scale 0 to 5
  const [aromaRadar, setAromaRadar] = useState<AromaRadarValues>({
    dulce: 2,
    amargo: 2,
    acido: 1,
    lupulo: 4,
    malta: 2,
  });

  // Sabor Radar state (Dulce, Amargo, Seco, Ácido, Fusel) - Scale 0 to 5
  const [saborRadar, setSaborRadar] = useState<SaborRadarValues>({
    dulce: 2,
    amargo: 3,
    seco: 2,
    acido: 1,
    fusel: 0,
  });

  const [aromaDescriptors, setAromaDescriptors] = useState<string[]>([
    'Cítrico',
    'Pino / Resina',
    'Tropical',
  ]);
  const [saborDescriptors, setSaborDescriptors] = useState<string[]>([
    'Sedoso / Untuoso',
    'Pan fresco',
  ]);

  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState('');
  const [pairing, setPairing] = useState('');
  const MAX_PHOTOS = 5;
  const [photos, setPhotos] = useState<string[]>([PRESET_PHOTOS[0].url]);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeToast, setBarcodeToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const handleApplyBeerData = (data: ScannedBeerData) => {
    let appliedCount = 0;

    if (data.name) {
      setName(data.name);
      appliedCount++;
    }
    if (data.brewery) {
      setBrewery(data.brewery);
      appliedCount++;
    }
    if (data.country) {
      setCountry(data.country);
      appliedCount++;
    }
    if (data.abv !== undefined) {
      setAbv(data.abv);
      appliedCount++;
    }
    if (data.ibu !== undefined) {
      setIbu(data.ibu);
      appliedCount++;
    }
    if (data.ebc !== undefined) {
      setEbc(data.ebc);
      appliedCount++;
    }
    if (data.srm !== undefined) {
      setSrm(data.srm);
    }
    if (data.style) {
      setStyle(normalizeBJCPStyle(data.style));
      appliedCount++;
    }

    if (data.imageUrl) {
      setPhotos((prev) => {
        const isDefault = prev.length === 1 && PRESET_PHOTOS.some((p) => p.url === prev[0]);
        if (isDefault) {
          return [data.imageUrl!];
        }
        return [data.imageUrl!, ...prev.filter((p) => p !== data.imageUrl)].slice(0, MAX_PHOTOS);
      });
      setPreviewPhotoIndex(0);
      appliedCount++;
    }

    setBarcodeToast({
      message: `¡Cerveza "${data.name || 'escaneada'}" importada con éxito desde Open Food Facts! (${appliedCount} campos autocompletados)`,
      type: 'success',
    });

    setTimeout(() => {
      setBarcodeToast(null);
    }, 5000);
  };

  const filteredCategoryGroups = useMemo(() => {
    if (!styleSearch.trim()) return BJCP_CATEGORY_GROUPS;
    const query = styleSearch.toLowerCase().trim();
    return BJCP_CATEGORY_GROUPS.map((group) => ({
      ...group,
      styles: group.styles.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          group.categoryName.toLowerCase().includes(query)
      ),
    })).filter((group) => group.styles.length > 0);
  }, [styleSearch]);

  useEffect(() => {
    if (editingCata) {
      setName(editingCata.name);
      setBrewery(editingCata.brewery);
      setCountry(editingCata.country || '');
      setAbv(editingCata.abv);
      setStyle(normalizeBJCPStyle(editingCata.style));
      setIbu(editingCata.ibu);
      setEbc(editingCata.ebc);
      setSrm(editingCata.srm);
      setClarity(editingCata.clarity);
      setFoamType(editingCata.foamType);
      setCarbonation(editingCata.carbonation);

      if (editingCata.aromaRadar) {
        setAromaRadar(editingCata.aromaRadar);
      } else if (editingCata.radarValues) {
        setAromaRadar({
          dulce: editingCata.radarValues.sweetness ?? 2,
          amargo: editingCata.radarValues.bitterness ?? 3,
          acido: 1,
          lupulo: editingCata.radarValues.hop ?? 3,
          malta: editingCata.radarValues.malt ?? 3,
        });
      }

      if (editingCata.saborRadar) {
        setSaborRadar(editingCata.saborRadar);
      } else if (editingCata.radarValues) {
        setSaborRadar({
          dulce: editingCata.radarValues.sweetness ?? 2,
          amargo: editingCata.radarValues.bitterness ?? 3,
          seco: 2,
          acido: 1,
          fusel: 0,
        });
      }

      setAromaDescriptors(editingCata.aromaDescriptors || []);
      setSaborDescriptors(
        editingCata.saborDescriptors || editingCata.otherDescriptors || []
      );

      setRating(editingCata.rating);
      setNotes(editingCata.notes);
      setPairing(editingCata.pairing || '');
      
      if (editingCata.images && editingCata.images.length > 0) {
        setPhotos(editingCata.images.slice(0, MAX_PHOTOS));
      } else if (editingCata.imageUrl) {
        setPhotos([editingCata.imageUrl]);
      } else {
        setPhotos([PRESET_PHOTOS[0].url]);
      }
    }
  }, [editingCata]);

  const processImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      setPhotoError('Por favor selecciona archivos de imagen válidos.');
      return;
    }
    setPhotoError(null);

    // If current photos is just the default single preset, clear it when adding user photos
    const isOnlyDefaultPreset =
      photos.length === 1 && PRESET_PHOTOS.some((p) => p.url === photos[0]);
    const currentBasePhotos = isOnlyDefaultPreset ? [] : photos;

    const availableSlots = MAX_PHOTOS - currentBasePhotos.length;
    if (availableSlots <= 0) {
      setPhotoError(`Has alcanzado el límite máximo de ${MAX_PHOTOS} fotografías.`);
      return;
    }

    const toProcess = fileArray.slice(0, availableSlots);
    if (fileArray.length > availableSlots) {
      setPhotoError(`Se añadieron las primeras ${availableSlots} fotos (máximo ${MAX_PHOTOS}).`);
    }

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Optimize and resize image for fast storage & mobile rendering
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setPhotos((prev) => {
              const base =
                prev.length === 1 && PRESET_PHOTOS.some((p) => p.url === prev[0])
                  ? []
                  : prev;
              if (base.length >= MAX_PHOTOS) return prev;
              return [...base, dataUrl];
            });
          }
        };
        img.onerror = () => {
          setPhotoError('No se pudo procesar una de las imágenes seleccionadas.');
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setPhotoError('Error al leer el archivo de fotografía.');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleDropPhoto = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const handleMakeMainPhoto = (index: number) => {
    if (index === 0 || index >= photos.length) return;
    setPhotos((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
    setPreviewPhotoIndex(0);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        return [PRESET_PHOTOS[0].url];
      }
      return updated;
    });
    setPreviewPhotoIndex(0);
  };

  const handleAddPresetPhoto = (url: string) => {
    setPhotos((prev) => {
      const isOnlyDefaultPreset =
        prev.length === 1 && PRESET_PHOTOS.some((p) => p.url === prev[0]);
      if (isOnlyDefaultPreset) {
        return [url];
      }
      if (prev.length >= MAX_PHOTOS) {
        setPhotoError(`Has alcanzado el límite máximo de ${MAX_PHOTOS} fotografías.`);
        return prev;
      }
      return [...prev, url];
    });
    setPhotoError(null);
  };

  const handleAromaRadarChange = (key: string, val: number) => {
    setAromaRadar((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSaborRadarChange = (key: string, val: number) => {
    setSaborRadar((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // 5-axis Radar configuration for Aroma: Dulce, Amargo, Ácido, Lúpulo, Malta
  const aromaAxes: Radar5Axis[] = [
    { key: 'dulce', label: 'Dulce', emoji: '🍬', value: aromaRadar.dulce },
    { key: 'amargo', label: 'Amargo', emoji: '🌿', value: aromaRadar.amargo },
    { key: 'acido', label: 'Ácido', emoji: '🍋', value: aromaRadar.acido },
    { key: 'lupulo', label: 'Lúpulo', emoji: '🌱', value: aromaRadar.lupulo },
    { key: 'malta', label: 'Malta', emoji: '🌾', value: aromaRadar.malta },
  ];

  // 5-axis Radar configuration for Sabor: Dulce, Amargo, Seco, Ácido, Fusel
  const saborAxes: Radar5Axis[] = [
    { key: 'dulce', label: 'Dulce', emoji: '🍬', value: saborRadar.dulce },
    { key: 'amargo', label: 'Amargo', emoji: '🌿', value: saborRadar.amargo },
    { key: 'seco', label: 'Seco', emoji: '🍷', value: saborRadar.seco },
    { key: 'acido', label: 'Ácido', emoji: '🍋', value: saborRadar.acido },
    { key: 'fusel', label: 'Fusel', emoji: '🔥', value: saborRadar.fusel },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor introduce el nombre de la cerveza.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);

      const newCata: BeerTasting = {
        id: editingCata ? editingCata.id : String(Date.now()),
        name: name.trim(),
        brewery: brewery.trim() || 'Cervecería Artesanal',
        country: country.trim(),
        abv: typeof abv === 'number' ? abv : 5.0,
        style,
        ibu: typeof ibu === 'number' ? ibu : 30,
        ebc: typeof ebc === 'number' ? ebc : 10,
        srm,
        clarity,
        foamType,
        carbonation,
        aromaRadar,
        saborRadar,
        radarValues: {
          hop: aromaRadar.lupulo,
          malt: aromaRadar.malta,
          bitterness: saborRadar.amargo,
          sweetness: saborRadar.dulce,
        },
        aromaDescriptors,
        saborDescriptors,
        otherDescriptors: saborDescriptors,
        rating,
        notes: notes.trim(),
        pairing: pairing.trim(),
        imageUrl: photos[0] || PRESET_PHOTOS[0].url,
        images: photos.length > 0 ? photos.slice(0, MAX_PHOTOS) : [PRESET_PHOTOS[0].url],
        createdAt: new Date().toISOString().split('T')[0],
      };

      setTimeout(() => {
        onSave(newCata);
      }, 600);
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full pb-28 animate-fade-in max-w-lg mx-auto">
      {/* Progress Indicator Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex-1 h-1 bg-[#fbad18] rounded-full" />
        <div className="mx-4 flex items-center gap-2">
          <span className="text-xs font-bold text-[#ffd18f] tracking-widest uppercase">
            {editingCata ? 'EDITAR CATA' : 'NUEVA ENTRADA'}
          </span>
          <span className="w-2 h-2 rounded-full bg-[#fbad18] animate-pulse" />
        </div>
        <div className="flex-1 h-1 bg-[#333535] rounded-full" />
      </div>

      {/* Toast Notification for Barcode Autofill */}
      {barcodeToast && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#fbad18]/15 border border-[#fbad18]/40 text-[#ffd18f] text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#7ef24a]">check_circle</span>
            <span className="font-medium leading-tight">{barcodeToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBarcodeToast(null)}
            className="text-[#9f8e79] hover:text-white p-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Button: Escanear Código de Barras at the top */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#282a2b] via-[#333535] to-[#282a2b] hover:from-[#3a3d3e] hover:to-[#3a3d3e] border border-[#fbad18]/40 hover:border-[#fbad18] text-[#ffd18f] shadow-md transition-all active:scale-[0.99] flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fbad18]/20 border border-[#fbad18]/40 flex items-center justify-center text-[#fbad18] group-hover:scale-110 transition-transform shrink-0">
              <span className="material-symbols-outlined text-2xl">barcode_scanner</span>
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm text-[#ffd18f] font-serif">
                Escanear Código de Barras
              </span>
              <span className="block text-[11px] text-[#d7c4ad] font-medium">
                Autocompletar datos con Open Food Facts
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#121414]/80 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-[#fbad18]">
            <span className="material-symbols-outlined text-base">photo_camera</span>
            <span className="text-[11px]">Escanear</span>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        {/* Section 1: Información General */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#ffd18f]">
            <span className="material-symbols-outlined text-xl">edit_note</span>
            <h2 className="text-xs font-bold tracking-widest uppercase">Información General</h2>
          </div>
          <div className="bg-[#1e2020] rounded-2xl p-4.5 flex flex-col gap-4 shadow-md border border-white/5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#d7c4ad]">Nombre de la Cerveza *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. West Coast IPA"
                className="bg-[#121414] border border-white/5 rounded-xl p-3 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all placeholder:text-[#524533]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#d7c4ad]">Cervecería</label>
              <input
                type="text"
                value={brewery}
                onChange={(e) => setBrewery(e.target.value)}
                placeholder="Ej. Sierra Nevada"
                className="bg-[#121414] border border-white/5 rounded-xl p-3 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all placeholder:text-[#524533]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#d7c4ad] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#fbad18]">public</span>
                País de Origen
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej. España, Bélgica, Alemania, EE.UU...."
                className="bg-[#121414] border border-white/5 rounded-xl p-3 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all placeholder:text-[#524533]"
              />
            </div>

            {/* BJCP Style Selector */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#d7c4ad] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#fbad18]">menu_book</span>
                  Estilo BJCP ({BJCP_STYLES.length} estilos oficiales)
                </label>
                <span className="text-[10px] text-[#ffd18f] font-mono font-bold bg-[#fbad18]/15 px-2 py-0.5 rounded-full border border-[#fbad18]/30">
                  Guía Oficial BJCP
                </span>
              </div>

              {/* Quick search input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9f8e79]">
                  search
                </span>
                <input
                  type="text"
                  value={styleSearch}
                  onChange={(e) => setStyleSearch(e.target.value)}
                  placeholder="Buscar estilo (ej. 21A, IPA, Stout, Pilsner, Gose)..."
                  className="w-full bg-[#121414] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all placeholder:text-[#524533]"
                />
                {styleSearch && (
                  <button
                    type="button"
                    onClick={() => setStyleSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9f8e79] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              {/* Select Dropdown with categories */}
              <div className="relative">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-[#121414] border border-white/10 rounded-xl p-3 text-sm text-[#ffd18f] font-semibold focus:ring-1 focus:ring-[#fbad18] outline-none transition-all pr-10 cursor-pointer"
                >
                  {filteredCategoryGroups.map((group) => (
                    <optgroup
                      key={group.categoryName}
                      label={group.categoryName}
                      className="bg-[#1e2020] text-[#d7c4ad] font-bold py-1"
                    >
                      {group.styles.map((s) => {
                        const label = getBJCPStyleLabel(s);
                        return (
                          <option
                            key={s.code}
                            value={label}
                            className="bg-[#121414] text-[#e2e2e2] py-1.5 font-normal"
                          >
                            {label}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                  {filteredCategoryGroups.length === 0 && (
                    <option disabled value="" className="bg-[#121414] text-[#9f8e79]">
                      No se encontraron estilos para "{styleSearch}"
                    </option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#fbad18]">
                  <span className="material-symbols-outlined text-lg">unfold_more</span>
                </div>
              </div>
            </div>

            {/* Technical metrics: ABV, IBU, EBC */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#d7c4ad] text-center">ABV %</label>
                <input
                  type="number"
                  step="0.1"
                  value={abv}
                  onChange={(e) => setAbv(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="6.5"
                  className="bg-[#121414] border border-white/5 rounded-xl p-2.5 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all text-center font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#d7c4ad] text-center">IBU (Amargor)</label>
                <input
                  type="number"
                  value={ibu}
                  onChange={(e) => setIbu(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="40"
                  className="bg-[#121414] border border-white/5 rounded-xl p-2.5 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all text-center font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#d7c4ad] text-center">EBC (Color)</label>
                <input
                  type="number"
                  value={ebc}
                  onChange={(e) => setEbc(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="12"
                  className="bg-[#121414] border border-white/5 rounded-xl p-2.5 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all text-center font-bold"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Apariencia */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#ffd18f]">
            <span className="material-symbols-outlined text-xl">visibility</span>
            <h2 className="text-xs font-bold tracking-widest uppercase">Apariencia</h2>
          </div>
          <div className="bg-[#1e2020] rounded-2xl p-4.5 flex flex-col gap-5 shadow-md border border-white/5">
            {/* SRM Slider Component */}
            <SRMSlider srm={srm} onChange={setSrm} />

            {/* Claridad and Tipo de Espuma */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#d7c4ad]">Claridad</label>
                <select
                  value={clarity}
                  onChange={(e) => setClarity(e.target.value as ClarityType)}
                  className="bg-[#121414] border border-white/5 rounded-xl p-3 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none appearance-none"
                >
                  <option value="Brillante">Brillante</option>
                  <option value="Velada">Velada</option>
                  <option value="Turbia">Turbia</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#d7c4ad]">Tipo de Espuma</label>
                <select
                  value={foamType}
                  onChange={(e) => setFoamType(e.target.value as FoamType)}
                  className="bg-[#121414] border border-white/5 rounded-xl p-3 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none appearance-none"
                >
                  <option value="Persistente">Persistente</option>
                  <option value="Fugaz">Fugaz</option>
                  <option value="Cremosa">Cremosa</option>
                  <option value="Jabonosa">Jabonosa</option>
                </select>
              </div>
            </div>

            {/* Carbonatación */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-[#d7c4ad]">
                <span className="font-semibold">Carbonatación</span>
                <span className="text-[#ffd18f] font-bold">{carbonation}</span>
              </div>
              <div className="flex items-center gap-3 bg-[#121414] p-2.5 rounded-xl border border-white/5">
                <span className="text-xs text-[#d7c4ad] w-8 text-center">Baja</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={carbonation === 'Baja' ? 1 : carbonation === 'Media' ? 2 : 3}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val === 1) setCarbonation('Baja');
                    if (val === 2) setCarbonation('Media');
                    if (val === 3) setCarbonation('Alta');
                  }}
                  className="flex-1 h-2 bg-[#333535] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
                />
                <span className="text-xs text-[#d7c4ad] w-8 text-center">Alta</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Perfil Sensorial (Separado en Aroma y Sabor) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#ffd18f]">
              <span className="material-symbols-outlined text-xl">psychiatry</span>
              <h2 className="text-xs font-bold tracking-widest uppercase">Perfil Sensorial</h2>
            </div>
            {/* View Selector Tabs */}
            <div className="flex bg-[#121414] p-1 rounded-xl border border-white/5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSensoryViewTab('aroma')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  sensoryViewTab === 'aroma'
                    ? 'bg-[#fbad18] text-[#121414] font-bold shadow'
                    : 'text-[#d7c4ad] hover:text-white'
                }`}
              >
                <span>👃</span>
                <span>Aroma</span>
              </button>
              <button
                type="button"
                onClick={() => setSensoryViewTab('sabor')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  sensoryViewTab === 'sabor'
                    ? 'bg-[#fbad18] text-[#121414] font-bold shadow'
                    : 'text-[#d7c4ad] hover:text-white'
                }`}
              >
                <span>👅</span>
                <span>Sabor</span>
              </button>
              <button
                type="button"
                onClick={() => setSensoryViewTab('ambos')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  sensoryViewTab === 'ambos'
                    ? 'bg-[#fbad18] text-[#121414] font-bold shadow'
                    : 'text-[#d7c4ad] hover:text-white'
                }`}
              >
                <span>👁️</span>
                <span>Ambos</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* SUBSECTION A: AROMA */}
            {(sensoryViewTab === 'aroma' || sensoryViewTab === 'ambos') && (
              <div className="bg-[#1e2020] rounded-2xl p-4.5 flex flex-col gap-5 shadow-md border border-[#fbad18]/20 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👃</span>
                    <div>
                      <h3 className="text-sm font-bold text-[#ffd18f]">Perfil de Aroma</h3>
                      <p className="text-[11px] text-[#9f8e79]">
                        Intensidades aromáticas en radar (Dulce, Amargo, Ácido, Lúpulo, Malta) y notas olfativas
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#fbad18]/15 text-[#ffd18f] px-2.5 py-1 rounded-full border border-[#fbad18]/30">
                    Olfativo
                  </span>
                </div>

                {/* Radar Pentágono 5 Ejes para Aroma */}
                <Radar5Chart
                  axes={aromaAxes}
                  onChange={handleAromaRadarChange}
                  interactive={true}
                  size={210}
                  accentColor="#FBAD18"
                  chartTitle="Radar Aromático"
                />

                {/* Otros Descriptores de Aroma con base de datos sensorial */}
                <DescriptorSelector
                  title="Otros Descriptores de Aroma"
                  subtitle="Selecciona notas de la base de datos o introduce las tuyas"
                  selectedDescriptors={aromaDescriptors}
                  onChange={setAromaDescriptors}
                  suggestedList={COMMON_AROMA_DESCRIPTORS}
                  placeholder="Ej. Fruta de la pasión, Pino, Cítrico..."
                  icon="local_florist"
                />
              </div>
            )}

            {/* SUBSECTION B: SABOR */}
            {(sensoryViewTab === 'sabor' || sensoryViewTab === 'ambos') && (
              <div className="bg-[#1e2020] rounded-2xl p-4.5 flex flex-col gap-5 shadow-md border border-[#fbad18]/20 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👅</span>
                    <div>
                      <h3 className="text-sm font-bold text-[#ffd18f]">Perfil de Sabor & Paladar</h3>
                      <p className="text-[11px] text-[#9f8e79]">
                        Intensidades gustativas en radar (Dulce, Amargo, Seco, Ácido, Fusel) y notas en boca
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#fbad18]/15 text-[#ffd18f] px-2.5 py-1 rounded-full border border-[#fbad18]/30">
                    Gustativo
                  </span>
                </div>

                {/* Radar Pentágono 5 Ejes para Sabor */}
                <Radar5Chart
                  axes={saborAxes}
                  onChange={handleSaborRadarChange}
                  interactive={true}
                  size={210}
                  accentColor="#F59E0B"
                  chartTitle="Radar de Sabor"
                />

                {/* Otros Descriptores de Sabor con base de datos sensorial */}
                <DescriptorSelector
                  title="Otros Descriptores de Sabor"
                  subtitle="Selecciona sensaciones y notas en boca de la base de datos"
                  selectedDescriptors={saborDescriptors}
                  onChange={setSaborDescriptors}
                  suggestedList={COMMON_SABOR_DESCRIPTORS}
                  placeholder="Ej. Sedoso, Galleta, Toffee, Resinoso..."
                  icon="restaurant"
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Veredicto & Photo */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#ffd18f]">
            <span className="material-symbols-outlined text-xl">grade</span>
            <h2 className="text-xs font-bold tracking-widest uppercase">Veredicto</h2>
          </div>
          <div className="bg-[#1e2020] rounded-2xl p-5 flex flex-col items-center gap-5 shadow-md border border-white/5 text-center">
            <div className="flex flex-col gap-2 items-center">
              <p className="font-serif text-xl font-bold text-[#e2e2e2]">¿Qué te pareció?</p>
              <div className="flex gap-1.5 text-[#ffd18f]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transform transition-transform hover:scale-125 active:scale-90"
                  >
                    <span
                      className={`material-symbols-outlined text-3xl ${
                        star <= rating ? 'symbol-fill-1' : 'symbol-fill-0 text-white/20'
                      }`}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe tus notas personales aquí... Sabor, sensaciones, persistencia..."
              className="w-full min-h-[100px] bg-[#121414] border border-white/5 rounded-xl p-3.5 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all resize-none placeholder:text-[#524533]"
            />

            <input
              type="text"
              value={pairing}
              onChange={(e) => setPairing(e.target.value)}
              placeholder="¿Con qué la maridarías? (Ej. Tacos de carne asada, Quesos maduros...)"
              className="w-full bg-[#121414] border border-white/5 rounded-xl p-3 text-sm text-[#e2e2e2] focus:ring-1 focus:ring-[#fbad18] outline-none transition-all placeholder:text-[#524533]"
            />

            {/* Photo Selection & Mobile Upload (Up to 5 Photos) */}
            <div className="w-full text-left space-y-3.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#d7c4ad] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#fbad18] text-base">photo_library</span>
                  Fotografías de la Cerveza
                </label>
                <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#121414] text-[#ffd18f] border border-white/10">
                  {photos.length} / {MAX_PHOTOS} fotos
                </span>
              </div>

              {/* Helper note explaining default main photo rule */}
              <div className="bg-[#121414] p-2.5 rounded-xl border border-white/5 flex items-start gap-2 text-[11px] text-[#d7c4ad]">
                <span className="material-symbols-outlined text-[#fbad18] text-sm shrink-0 mt-0.5">
                  star
                </span>
                <p className="leading-snug">
                  <strong className="text-[#ffd18f]">La primera foto es la principal</strong> y la que se mostrará como portada por defecto. Puedes pulsar <span className="text-[#ffd18f] font-semibold">"Hacer Principal"</span> en cualquier foto para cambiarla.
                </p>
              </div>

              {/* Hidden File Inputs */}
              <input
                id="photo-upload-input"
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                id="camera-capture-input"
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Featured / Active Preview Hero */}
              {photos.length > 0 && (
                <div className="relative h-52 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#121414] shadow-md group">
                  <img
                    src={photos[previewPhotoIndex < photos.length ? previewPhotoIndex : 0]}
                    alt={`Foto ${previewPhotoIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Top Badge: Main vs Secondary */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {previewPhotoIndex === 0 ? (
                      <span className="bg-[#fbad18] text-[#684500] text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg border border-[#ffd18f]/40">
                        <span className="material-symbols-outlined text-xs">star</span>
                        Foto Principal / Portada
                      </span>
                    ) : (
                      <span className="bg-black/60 backdrop-blur-md text-[#ffd18f] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                        <span className="material-symbols-outlined text-xs">photo</span>
                        Foto #{previewPhotoIndex + 1}
                      </span>
                    )}
                  </div>

                  {/* Bottom Action bar inside preview */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                    <span className="text-[11px] text-white/80 font-mono">
                      Foto {previewPhotoIndex + 1} de {photos.length}
                    </span>

                    <div className="flex gap-1.5">
                      {previewPhotoIndex !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMakeMainPhoto(previewPhotoIndex)}
                          className="px-2.5 py-1 bg-[#fbad18] hover:bg-[#ffbe3b] text-[#684500] text-xs font-black rounded-lg shadow-md flex items-center gap-1 transition-all active:scale-95"
                          title="Establecer como foto principal"
                        >
                          <span className="material-symbols-outlined text-sm">star</span>
                          Hacer Principal
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(previewPhotoIndex)}
                        className="px-2.5 py-1 bg-red-950/80 hover:bg-red-700 text-red-200 text-xs font-bold rounded-lg border border-red-500/30 flex items-center gap-1 transition-all"
                        title="Eliminar esta foto"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnails Row / Grid (Up to 5 Slots) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#9f8e79] block">
                  Galería de fotos ({photos.length} de {MAX_PHOTOS}):
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {photos.map((photoUrl, idx) => {
                    const isPreview = (previewPhotoIndex < photos.length ? previewPhotoIndex : 0) === idx;
                    const isMain = idx === 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => setPreviewPhotoIndex(idx)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                          isPreview
                            ? 'border-[#fbad18] ring-2 ring-[#fbad18]/40 scale-105 shadow-md'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={photoUrl}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Index Number Badge */}
                        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/70 text-[9px] font-bold text-white flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {/* Main Star Badge on Index 0 */}
                        {isMain && (
                          <span className="absolute bottom-1 right-1 bg-[#fbad18] text-[#684500] rounded-full p-0.5 shadow">
                            <span className="material-symbols-outlined text-[10px] block font-bold">star</span>
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Slot if photos.length < MAX_PHOTOS */}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-[#fbad18] bg-[#121414] hover:bg-white/5 flex flex-col items-center justify-center gap-1 text-[#ffd18f] transition-all group"
                      title="Añadir otra fotografía"
                    >
                      <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                        add_a_photo
                      </span>
                      <span className="text-[9px] font-bold text-[#d7c4ad]">
                        +{MAX_PHOTOS - photos.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Photo Error message if any */}
              {photoError && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{photoError}</span>
                </div>
              )}

              {/* Mobile & File Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Button: Camera */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={photos.length >= MAX_PHOTOS}
                  className="py-2.5 px-3 rounded-xl bg-[#282a2b] hover:bg-[#333535] active:scale-95 border border-white/10 hover:border-[#fbad18]/50 flex items-center justify-center gap-2 text-xs font-bold text-[#ffd18f] transition-all shadow-sm disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base text-[#fbad18]">
                    photo_camera
                  </span>
                  <span>Tomar Foto</span>
                </button>

                {/* Button: Multi-file / Gallery */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photos.length >= MAX_PHOTOS}
                  className="py-2.5 px-3 rounded-xl bg-[#282a2b] hover:bg-[#333535] active:scale-95 border border-white/10 hover:border-[#fbad18]/50 flex items-center justify-center gap-2 text-xs font-bold text-[#ffd18f] transition-all shadow-sm disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base text-[#fbad18]">
                    add_photo_alternate
                  </span>
                  <span>Subir Fotos ({MAX_PHOTOS - photos.length} libres)</span>
                </button>
              </div>

              {/* Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(true);
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={handleDropPhoto}
                className={`p-3 rounded-xl border border-dashed text-center transition-all ${
                  isDraggingPhoto
                    ? 'border-[#fbad18] bg-[#fbad18]/10'
                    : 'border-white/10 bg-[#121414]/50'
                }`}
              >
                <p className="text-[11px] text-[#9f8e79]">
                  Arrastra y suelta hasta 5 imágenes aquí desde tu ordenador o explorador
                </p>
              </div>

              {/* Preset Photos Selector */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-[#d7c4ad] block">
                  O añade fotos de muestra predeterminadas:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_PHOTOS.map((photo, i) => {
                    const isIncluded = photos.includes(photo.url);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddPresetPhoto(photo.url)}
                        disabled={photos.length >= MAX_PHOTOS && !isIncluded}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          isIncluded
                            ? 'border-[#fbad18] shadow-md ring-1 ring-[#fbad18]/40'
                            : 'border-white/10 opacity-70 hover:opacity-100'
                        } disabled:opacity-30`}
                        title={`Añadir ${photo.name}`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        {isIncluded && (
                          <div className="absolute inset-0 bg-[#fbad18]/25 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base drop-shadow-md font-bold">
                              check_circle
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-[#fbad18] to-[#ffd18f] text-[#684500] h-14 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                <span>Guardando...</span>
              </>
            ) : saveSuccess ? (
              <>
                <span className="material-symbols-outlined text-xl text-[#103900]">check_circle</span>
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">save</span>
                <span>{editingCata ? 'Actualizar Cata' : 'Guardar Cata'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full h-14 rounded-full text-xs font-bold text-[#d7c4ad] uppercase tracking-widest flex items-center justify-center border border-white/10 active:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Barcode Scanner Camera Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyBeerData={handleApplyBeerData}
      />
    </div>
  );
};
