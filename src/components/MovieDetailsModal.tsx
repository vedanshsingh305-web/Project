import React, { useState, useEffect } from 'react';
import { X, Star, Clock, Calendar, MapPin, Film, Play, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Movie, Showtime } from '../types';
import { api } from '../services/api';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
  onSelectShowtime: (showtime: Showtime) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onSelectShowtime,
}) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [showTrailer, setShowTrailer] = useState<boolean>(false);

  // Generate 4 consecutive dates: Today, Tomorrow, +2d, +3d
  const dates = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateObj: d,
      isoDate: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateString: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  useEffect(() => {
    if (!movie) return;
    setLoading(true);

    api
      .getMovieById(movie._id)
      .then((res) => {
        if (res.success && res.data) {
          setShowtimes(res.data.showtimes || []);
        }
      })
      .catch((err) => console.error('Failed to load movie details:', err))
      .finally(() => setLoading(false));
  }, [movie]);

  if (!movie) return null;

  const selectedDate = dates[selectedDateIndex].isoDate;

  // Filter showtimes by selected date
  const filteredShowtimes = showtimes.filter((st) => {
    const stDate = new Date(st.startTime).toISOString().split('T')[0];
    const matchesDate = stDate === selectedDate;
    const matchesCity = selectedCity === 'All' || (st.theatre && st.theatre.city === selectedCity);
    return matchesDate && matchesCity;
  });

  // Group showtimes by theatre
  const groupedByTheatre = filteredShowtimes.reduce((acc, st) => {
    const thId = st.theatre?._id || 'unknown';
    if (!acc[thId]) {
      acc[thId] = {
        theatre: st.theatre,
        screen: st.screen,
        shows: [],
      };
    }
    acc[thId].shows.push(st);
    return acc;
  }, {} as Record<string, { theatre: any; screen: any; shows: Showtime[] }>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center border border-neutral-700/80 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner Header */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-950 shrink-0">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />

          {/* Floating poster and basic info */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-5">
            <div className="hidden sm:block w-28 aspect-[3/4] rounded-lg overflow-hidden border border-neutral-700/80 shadow-2xl shrink-0 bg-neutral-950">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-neutral-300 mb-1">
                <span>{movie.genres.join(' / ')}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span className="tabular-nums">{movie.duration}m</span>
                </span>
                <span>·</span>
                <span>{movie.language}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h2>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">{movie.rating.toFixed(1)} / 10</span>
                </div>
                {movie.ageClassification && (
                  <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-semibold">
                    {movie.ageClassification}
                  </span>
                )}
                {movie.director && (
                  <span className="text-xs text-neutral-400">Dir. {movie.director}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Synopsis & Cast */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Synopsis</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">{movie.description}</p>
            </div>

            <div className="space-y-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800/80 text-xs">
              <div>
                <span className="text-neutral-500 block mb-0.5 font-semibold">Starring</span>
                <span className="text-neutral-200">{movie.cast && movie.cast.length > 0 ? movie.cast.join(', ') : 'Ensemble cast'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-0.5 font-semibold">Director</span>
                <span className="text-neutral-200">{movie.director}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-0.5 font-semibold">Release Date</span>
                <span className="text-neutral-200">{new Date(movie.releaseDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Showtimes & Theatres Booking Section */}
          <div className="border-t border-neutral-800 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-500" />
                  <span>Select Date & Showtime</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pick your preferred cinema session to open the interactive seating chart
                </p>
              </div>

              {/* Date Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                {dates.map((d, idx) => (
                  <button
                    key={d.isoDate}
                    onClick={() => setSelectedDateIndex(idx)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex flex-col items-center leading-tight ${
                      selectedDateIndex === idx
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">{d.dayName}</span>
                    <span>{d.dateString}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Release Notice */}
            {movie.releaseStatus === 'upcoming' ? (
              <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">Theatrical Premiere Advance Notice</h4>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  {movie.title} is scheduled for release on {new Date(movie.releaseDate).toLocaleDateString()}. Advance ticket booking will unlock 7 days before theatrical debut.
                </p>
              </div>
            ) : loading ? (
              <div className="py-12 flex items-center justify-center gap-3 text-sm text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                <span>Loading available cinema showtimes...</span>
              </div>
            ) : Object.keys(groupedByTheatre).length === 0 ? (
              <div className="p-8 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center space-y-2">
                <p className="text-sm font-medium text-neutral-300">No scheduled sessions for this date</p>
                <p className="text-xs text-neutral-500">Please choose another day or check back later for schedule updates.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(groupedByTheatre).map(({ theatre, screen, shows }) => (
                  <div
                    key={theatre._id}
                    className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-2.5">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{theatre.name}</span>
                        </h4>
                        <p className="text-xs text-neutral-500 ml-5">{theatre.address}, {theatre.city}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        {theatre.facilities?.slice(0, 2).map((fac: string) => (
                          <span key={fac} className="text-neutral-400">
                            · {fac}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Showtime Buttons */}
                    <div className="flex items-center gap-2.5 flex-wrap pt-1">
                      {shows.map((st) => {
                        const timeStr = new Date(st.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        });
                        return (
                          <button
                            key={st._id}
                            onClick={() => {
                              onClose();
                              onSelectShowtime(st);
                            }}
                            className="group flex flex-col items-center px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-red-500/80 hover:bg-neutral-850 transition-all text-left"
                          >
                            <span className="text-sm font-extrabold text-white group-hover:text-red-400 tabular-nums">
                              {timeStr}
                            </span>
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                              {st.screen?.screenType || 'Dolby'}
                            </span>
                            <span className="text-[11px] text-amber-400 font-medium tabular-nums mt-0.5">
                              From ${st.basePrice.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
