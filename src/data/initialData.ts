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

export const INITIAL_TASTINGS: BeerTasting[] = [];

export { BJCP_STYLE_CATEGORIES as STYLE_CATEGORIES, BJCP_STYLE_DETAILS_DB as STYLE_DETAILS } from './bjcpStyleDetails';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Catador Cervecero',
  title: 'Iniciado',
  bio: 'Explorador de cervezas artesanales',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  isPro: false,
  stats: {
    totalCatas: 0,
    totalEstilos: 0,
    favoriteBrewery: '—',
  },
  achievements: [
    { id: '1', title: 'IPA Hunter', icon: 'fluid_med', unlocked: false },
    { id: '2', title: 'First Sip', icon: 'celebration', unlocked: false },
    { id: '3', title: 'Dark Side', icon: 'dark_mode', unlocked: false },
    { id: '4', title: 'Mundialista', icon: 'travel_explore', unlocked: false },
    { id: '5', title: 'Sommelier', icon: 'workspace_premium', unlocked: false },
  ],
};

export const LOGO_URL = '/icon.png';
