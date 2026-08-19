import React from 'react';
import { srmToHex } from '../data/initialData';

interface SRMSliderProps {
  srm: number;
  onChange: (srm: number) => void;
}

export const SRMSlider: React.FC<SRMSliderProps> = ({ srm, onChange }) => {
  const hexColor = srmToHex(srm);

  const getSRMName = (val: number) => {
    if (val <= 3) return 'Pajizo (Straw)';
    if (val <= 6) return 'Dorado (Gold)';
    if (val <= 9) return 'Ámbar Claro (Amber)';
    if (val <= 15) return 'Ámbar Oscuro / Cobre';
    if (val <= 22) return 'Marrón / Rubí';
    if (val <= 30) return 'Marrón Oscuro';
    return 'Negro (Opaco)';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div>
          <label className="text-xs font-semibold text-[#d7c4ad] uppercase tracking-wider block mb-1">
            Color (SRM: {srm})
          </label>
          <span className="text-xs text-[#ffd18f] font-medium">{getSRMName(srm)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg transition-colors duration-300"
            style={{ backgroundColor: hexColor }}
          />
        </div>
      </div>

      <input
        type="range"
        min="1"
        max="40"
        value={srm}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 bg-gradient-to-r from-[#F8F753] via-[#D48806] to-[#080707] rounded-lg appearance-none cursor-pointer accent-white"
      />

      <div className="flex justify-between text-[11px] font-medium text-[#d7c4ad]">
        <span>Pajizo (1-4)</span>
        <span>Ámbar (12-18)</span>
        <span>Negro (30+)</span>
      </div>
    </div>
  );
};
