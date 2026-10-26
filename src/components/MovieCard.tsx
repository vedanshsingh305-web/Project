import React, { useState } from 'react';
import { Star, Clock, Calendar, Ticket } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onBookNow?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect, onBookNow }) => {
  const [imageError, setImageError] = useState(false);

  const formattedDate = new Date(movie.releaseDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(movie)}
      className="group relative flex flex-col bg-neutral-900/60 rounded-xl border border-neutral-800/80 overflow-hidden hover:border-neutral-700 hover:shadow-xl hover:shadow-black/50 transition-all duration-200 cursor-pointer"
    >
      {/* Poster Media Box with 3:4 aspect ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
        {!imageError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 to-neutral-950">
            <span className="text-red-500 font-extrabold text-2xl tracking-tighter mb-2">IMOVIES</span>
            <span className="text-white font-semibold text-sm line-clamp-2">{movie.title}</span>
            <span className="text-neutral-500 text-xs mt-2">{movie.genres.join(', ')}</span>
          </div>
        )}

        {/* Ambient overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Floating Rating Indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950/85 backdrop-blur-md border border-neutral-800 text-xs font-semibold text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{movie.rating.toFixed(1)}</span>
        </div>

        {/* Age Classification tag if available */}
        {movie.ageClassification && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-neutral-700/80 text-[10px] font-bold text-neutral-300">
            {movie.ageClassification}
          </div>
        )}

        {/* Quick hover Book Now overlay */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow(movie);
              else onSelect(movie);
            }}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-950 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>{movie.releaseStatus === 'upcoming' ? 'View Premiere Details' : 'Book Tickets'}</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed Metadata Line with typographic separators */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5 flex-wrap">
            <span>{movie.genres.slice(0, 2).join(' / ')}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-500" />
              <span className="tabular-nums">{movie.duration}m</span>
            </span>
          </div>

          {/* Primary Movie Title */}
          <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
            {movie.title}
          </h3>

          <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
            {movie.description}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
          <span className="truncate max-w-[140px] text-neutral-400">{movie.language}</span>
          <span className="text-[11px] text-neutral-400 flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3 text-neutral-400" />
            <span>{formattedDate}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
