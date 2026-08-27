export type ClarityType = 'Brillante' | 'Velada' | 'Turbia';
export type FoamType = 'Persistente' | 'Fugaz' | 'Cremosa' | 'Jabonosa';
export type CarbonationType = 'Baja' | 'Media' | 'Alta';

export interface AromaRadarValues {
  dulce: number;   // 0 - 5
  amargo: number;  // 0 - 5
  acido: number;   // 0 - 5
  lupulo: number;  // 0 - 5
  malta: number;   // 0 - 5
}

export interface SaborRadarValues {
  dulce: number;   // 0 - 5
  amargo: number;  // 0 - 5
  seco: number;    // 0 - 5
  acido: number;   // 0 - 5
  fusel: number;   // 0 - 5
}

export interface RadarValues {
  hop?: number;        // 0 - 5 (Lúpulo)
  malt?: number;       // 0 - 5 (Malta)
  bitterness?: number; // 0 - 5 (Amargor)
  sweetness?: number;  // 0 - 5 (Dulzor)
}

export interface BeerTasting {
  id: string;
  name: string;
  brewery: string;
  country?: string;
  abv: number;
  style: string;
  ibu: number;
  ebc: number;
  srm: number;
  clarity: ClarityType;
  foamType: FoamType;
  carbonation: CarbonationType;
  aromaRadar?: AromaRadarValues;
  saborRadar?: SaborRadarValues;
  radarValues?: RadarValues;
  aromaDescriptors: string[];
  saborDescriptors?: string[];
  otherDescriptors: string[];
  rating: number; // 1 to 5
  notes: string;
  pairing?: string;
  imageUrl: string;
  images?: string[]; // Up to 5 photos. images[0] is the main/cover photo
  createdAt: string;
}

export interface StyleCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  bgImage: string;
}

export interface StyleDetail {
  id: string;
  code: string;
  name: string;
  category: string;
  categoryNumber?: number | string;
  abvRange: string;
  ibuRange: string;
  srmRange: string;
  srm: number;
  ebcRange: string;
  ebc: number;
  description: string;
  flavorProfile: string;
  pairingSuggestions: string;
  imageUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
}

export interface UserProfile {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  isPro: boolean;
  stats: {
    totalCatas: number;
    totalEstilos: number;
    favoriteBrewery: string;
  };
  achievements: Achievement[];
}

export type ActiveTab = 'mis-catas' | 'estilos' | 'nueva-cata' | 'insignias' | 'perfil';
