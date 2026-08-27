import React from 'react';
import { motion } from 'motion/react';
import { BeerTasting } from '../types';
import { srmToHex } from '../data/initialData';

interface BeerCardProps {
  beer: BeerTasting;
  onClick: (beer: BeerTasting) => void;
  index?: number;
}

export const BeerCard: React.FC<BeerCardProps> = ({ beer, onClick, index = 0 }) => {
  const hexColor = srmToHex(beer.srm);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(
          <span key={i} className="material-symbols-outlined text-sm symbol-fill-1 text-[#ffd18f]">
            star
          </span>
        );
      } else if (i - 0.5 <= rating) {
        stars.push(
          <span key={i} className="material-symbols-outlined text-sm symbol-fill-1 text-[#ffd18f]">
            star_half
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="material-symbols-outlined text-sm symbol-fill-0 text-white/20">
            star
          </span>
        );
      }
    }
    return stars;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.07,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onClick={() => onClick(beer)}
      className="bg-[#282a2b] rounded-xl overflow-hidden shadow-md border border-white/5 flex active:scale-[0.98] transition-all cursor-pointer group hover:border-[#fbad18]/30"
    >
      {/* Left Thumbnail */}
      <div className="w-28 h-auto min-h-[110px] relative overflow-hidden bg-[#121414] shrink-0">
        <img
          src={(beer.images && beer.images.length > 0) ? beer.images[0] : beer.imageUrl}
          alt={beer.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#282a2b]/60" />
        {beer.images && beer.images.length > 1 && (
          <span className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-[#ffd18f] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/10">
            <span className="material-symbols-outlined text-[10px]">photo_library</span>
            {beer.images.length}
          </span>
        )}
      </div>

      {/* Info Content */}
      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
        {/* Línea 1: Nombre principal de la cerveza */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-serif text-[19px] font-bold text-[#ffd18f] truncate leading-tight group-hover:text-[#fbad18] min-w-0 flex-1">
            {beer.name}
          </h3>
          {/* SRM Indicator Dot */}
          <div
            className="w-4 h-4 rounded-full border border-white/20 shadow-inner shrink-0 mt-0.5"
            style={{ backgroundColor: hexColor }}
            title={`SRM: ${beer.srm}`}
          />
        </div>

        {/* Línea 2: Cervecería y País de origen */}
        <p className="text-xs text-[#d7c4ad] font-medium truncate flex items-center gap-1 min-w-0 mt-1">
          <span className="truncate">{beer.brewery}</span>
          {beer.country && (
            <>
              <span className="text-[#9f8e79] shrink-0">•</span>
              <span className="text-[#9f8e79] truncate">{beer.country}</span>
            </>
          )}
        </p>

        {/* Línea 3 / Fila inferior: Categoría y Valoración por estrellas */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/5">
          <span className="text-[11px] font-medium px-2 py-0.5 bg-[#1e2020] rounded border border-white/10 text-[#ffd18f] truncate max-w-[130px]">
            {beer.style}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {renderStars(beer.rating)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
