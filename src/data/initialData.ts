import { BeerTasting, StyleCategory, StyleDetail, UserProfile } from '../types';

export const srmToHex = (srm: number): string => {
  if (srm <= 2) return '#F8F753';
  if (srm <= 5) return '#F3F993';
  if (srm <= 8) return '#F5F75C';
  if (srm <= 12) return '#E58500';
  if (srm <= 15) return '#D48806';
  if (srm <= 20) return '#BF7506';
  if (srm <= 25) return '#814502';
  if (srm <= 30) return '#4F2C05';
  if (srm <= 35) return '#261403';
  return '#080707';
};

export const INITIAL_TASTINGS: BeerTasting[] = [
  {
    id: '1',
    name: 'Nebula Haze IPA',
    brewery: 'Stellar Brewing Co.',
    country: 'Estados Unidos',
    abv: 6.8,
    style: '21C. Hazy IPA / New England IPA',
    ibu: 45,
    ebc: 8,
    srm: 4,
    clarity: 'Turbia',
    foamType: 'Persistente',
    carbonation: 'Media',
    aromaRadar: {
      dulce: 2,
      amargo: 2,
      acido: 1,
      lupulo: 5,
      malta: 2,
    },
    saborRadar: {
      dulce: 2,
      amargo: 3,
      seco: 2,
      acido: 1,
      fusel: 1,
    },
    radarValues: {
      hop: 5,
      malt: 2,
      bitterness: 3,
      sweetness: 2,
    },
    aromaDescriptors: ['Fruta de la pasión / Maracuyá', 'Mango', 'Cítrico', 'Pino / Resina', 'Pomelo / Toronja'],
    saborDescriptors: ['Sedoso / Untuoso', 'Cítrico', 'Tropical', 'Melocotón / Durazno', 'Hierba cortada / Césped'],
    otherDescriptors: ['Cítrico', 'Tropical', 'Pino'],
    rating: 4.5,
    notes: 'Aromas intensos a maracuyá y mango recién cortado. Amargor muy sedoso y final suave en paladar.',
    pairing: 'Tacos de pescado capeado con emulsión de cilantro y lima.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC_9PJePcFLLcmRE6sUfky3cjo9U1uS6kSCsEq92ZLKF91Wi_6oV82C_vygjZ-Pl9n7lHja7CgD1rPvD_Jrzo9wOxw76iCEMsjFSKcxPTEtgTTNMW4q91IXep0-l9WM_oLiFwKsvxTEoYY6egS5Wq27u459SEjfmVutKeDlkWamGBR5k73CPM1ehNquhO09SdS8l6nfcWCXcUyGfEM4CcbXlxc8QxOTAm4XkwiOkBuSh0fPiE8uOCB4A',
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCC_9PJePcFLLcmRE6sUfky3cjo9U1uS6kSCsEq92ZLKF91Wi_6oV82C_vygjZ-Pl9n7lHja7CgD1rPvD_Jrzo9wOxw76iCEMsjFSKcxPTEtgTTNMW4q91IXep0-l9WM_oLiFwKsvxTEoYY6egS5Wq27u459SEjfmVutKeDlkWamGBR5k73CPM1ehNquhO09SdS8l6nfcWCXcUyGfEM4CcbXlxc8QxOTAm4XkwiOkBuSh0fPiE8uOCB4A'],
    createdAt: '2026-07-28',
  },
  {
    id: '2',
    name: 'Midnight Stout',
    brewery: 'Obsidian Labs',
    country: 'Reino Unido',
    abv: 9.2,
    style: '20C. Imperial Stout',
    ibu: 65,
    ebc: 80,
    srm: 40,
    clarity: 'Brillante',
    foamType: 'Cremosa',
    carbonation: 'Baja',
    aromaRadar: {
      dulce: 3,
      amargo: 4,
      acido: 0,
      lupulo: 1,
      malta: 5,
    },
    saborRadar: {
      dulce: 3,
      amargo: 4,
      seco: 3,
      acido: 0,
      fusel: 3,
    },
    radarValues: {
      hop: 2,
      malt: 5,
      bitterness: 4,
      sweetness: 3,
    },
    aromaDescriptors: ['Café espresso', 'Chocolate negro / Amargo', 'Vainilla de barrica', 'Malta chocolate', 'Caramelo oscuro / Toffee'],
    saborDescriptors: ['Café espresso', 'Chocolate negro / Amargo', 'Calor alcohólico reconfortante', 'Con cuerpo / Denso', 'Malta torrefacta'],
    otherDescriptors: ['Café', 'Chocolate', 'Vainilla'],
    rating: 5,
    notes: 'Cuerpo denso y licoroso. Sabor profundo a café espresso recién molido y chocolate negro 85%.',
    pairing: 'Tarta de mousse de chocolate amargo o quesos azules madurados.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVYqD1Yx-hlakQo0vx37q1DneDT056e_yoV-BF2DOp-R7cLjILHwV_jPT4pEWawzLf-elnsaEA1U2YUt8DLiGAMzgZZTzmepUEN7toemTB-7iOx4rXzOQ23doYWTFTZD4v-yjytSPfSaBSV3GsfNUq9Rf4hTqXtq6eDS-InyINXer76oVFH99TkxF2WvHYpBffiVWQIL_t1PUBWjM4HqUw7AUBOcOHc0sKOnmodFXJJiqatyb-wROffw',
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDVYqD1Yx-hlakQo0vx37q1DneDT056e_yoV-BF2DOp-R7cLjILHwV_jPT4pEWawzLf-elnsaEA1U2YUt8DLiGAMzgZZTzmepUEN7toemTB-7iOx4rXzOQ23doYWTFTZD4v-yjytSPfSaBSV3GsfNUq9Rf4hTqXtq6eDS-InyINXer76oVFH99TkxF2WvHYpBffiVWQIL_t1PUBWjM4HqUw7AUBOcOHc0sKOnmodFXJJiqatyb-wROffw'],
    createdAt: '2026-07-25',
  },
  {
    id: '3',
    name: 'Cactus Sour',
    brewery: 'Prickly Pear Brewing',
    country: 'México',
    abv: 5.2,
    style: '23G. Gose',
    ibu: 12,
    ebc: 20,
    srm: 18,
    clarity: 'Velada',
    foamType: 'Fugaz',
    carbonation: 'Alta',
    aromaRadar: {
      dulce: 2,
      amargo: 1,
      acido: 4,
      lupulo: 1,
      malta: 2,
    },
    saborRadar: {
      dulce: 2,
      amargo: 1,
      seco: 4,
      acido: 4,
      fusel: 0,
    },
    radarValues: {
      hop: 1,
      malt: 2,
      bitterness: 1,
      sweetness: 3,
    },
    aromaDescriptors: ['Ácido láctico (yogur/limpio)', 'Frambuesa', 'Limón', 'Frutos rojos', 'Cidra / Bergamota'],
    saborDescriptors: ['Ácido láctico (yogur/limpio)', 'Efervescente / Chispeante', 'Seco / Crisp finish', 'Lima', 'Ligero / Crisp'],
    otherDescriptors: ['Frutal', 'Cítrico', 'Frambuesa'],
    rating: 3.5,
    notes: 'Acidez punzante y refrescante con notas a tuna roja, lima agria y toque salino.',
    pairing: 'Ceviche de camarón fresco o ensaladas con vinagreta de cítricos.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvQ3cdSj1fb1-P0_IZjX19_KXMd0YrFiT7xMzNd89SCso-1ufx6s_Lg_Zj07ZvyB0aMeykZGcv29gUSK0eS99qtnCiadS2Ili0RKWm62AEDFTNjR2aCzHIli8w5_vV6WgonWVTD_H8Cg7lcwD3-I6r-CK_vYLbEIK4Ekpb7y8J7NVFN8jhrvktBToq76h1VdSolMJnlSJhGuxG8DY1tUMpEttJDEeMM0nWFDC-_wme6PNytix8GRUGgA',
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBvQ3cdSj1fb1-P0_IZjX19_KXMd0YrFiT7xMzNd89SCso-1ufx6s_Lg_Zj07ZvyB0aMeykZGcv29gUSK0eS99qtnCiadS2Ili0RKWm62AEDFTNjR2aCzHIli8w5_vV6WgonWVTD_H8Cg7lcwD3-I6r-CK_vYLbEIK4Ekpb7y8J7NVFN8jhrvktBToq76h1VdSolMJnlSJhGuxG8DY1tUMpEttJDEeMM0nWFDC-_wme6PNytix8GRUGgA'],
    createdAt: '2026-07-20',
  }
];

export { BJCP_STYLE_CATEGORIES as STYLE_CATEGORIES, BJCP_STYLE_DETAILS_DB as STYLE_DETAILS } from './bjcpStyleDetails';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Carlos M.',
  title: 'Maestro Cervecero',
  bio: 'Explorador de lúpulos desde 2018',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnhzjrdL6cvoEXp8JcQUnzywhuQg4x6tbBPUDccN-pssBqGuEogECmfxxtk7i7F0zp93ntDSDQ4hs6q3kjWlCpcyiAVLjzkFhf-eCmyOv0zco8m9v13U6Inx-UTk6npFEn0ptaZzJK_LDc2pjXnpBsgVxn5xwiyM760EMw0ndA0lfKUjV2JMd9-kJ64uJ1Zf6AlBIsA_lvypKjigu6g1A2rH2E1HfCknH-Vqy8-cH3kZ_qwPfUu-2Rjg',
  isPro: true,
  stats: {
    totalCatas: 48,
    totalEstilos: 12,
    favoriteBrewery: 'BrewDog',
  },
  achievements: [
    { id: '1', title: 'IPA Hunter', icon: 'fluid_med', unlocked: true },
    { id: '2', title: 'First Sip', icon: 'celebration', unlocked: true },
    { id: '3', title: 'Dark Side', icon: 'dark_mode', unlocked: true },
    { id: '4', title: 'Mundialista', icon: 'travel_explore', unlocked: false },
    { id: '5', title: 'Sommelier', icon: 'workspace_premium', unlocked: false },
  ],
};

export const LOGO_URL = '/icon.png';
