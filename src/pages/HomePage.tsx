import React, { useState, useEffect } from 'react';
import { Play, Ticket, Star, Clock, ChevronRight, ShieldCheck, Sparkles, Film, ArrowRight } from 'lucide-react';
import { Movie, Showtime } from '../types';
import { MovieCard } from '../components/MovieCard';
import { api } from '../services/api';

interface HomePageProps {
  onSelectMovie: (movie: Movie) => void;
  onBookMovie: (movie: Movie) => void;
  onNavigate: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectMovie, onBookMovie, onNavigate }) => {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getMovies({ status: 'now_showing', limit: 8 }),
      api.getMovies({ status: 'upcoming', limit: 4 }),
    ])
      .then(([nowRes, upRes]) => {
        if (nowRes.success && nowRes.data) {
          setNowShowing(nowRes.data);
          const feat = nowRes.data.find((m) => m.featured) || nowRes.data[0];
          setFeaturedMovie(feat || null);
          if (nowRes.meta?.genres) {
            setGenres(['All', ...nowRes.meta.genres]);
          }
        }
        if (upRes.success && upRes.data) {
          setUpcoming(upRes.data);
        }
      })
      .catch((err) => console.error('Failed to load home movies:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredNowShowing = nowShowing.filter((m) => {
    if (selectedGenre === 'All') return true;
    return m.genres.includes(selectedGenre);
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Showcase Section */}
      {featuredMovie && (
        <section className="relative w-full min-h-[520px] lg:min-h-[580px] bg-neutral-950 flex items-center overflow-hidden border-b border-neutral-900">
          {/* Backdrop Graphic */}
          <div className="absolute inset-0">
            <img
              src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center opacity-40 scale-105"
            />
            {/* Multi-layered cinematic gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
            <div className="max-w-2xl space-y-5">
              {/* Clean unboxed kicker */}
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <span className="text-red-500 font-extrabold uppercase tracking-wider">FEATURED PREMIERE</span>
                <span>·</span>
                <span>{featuredMovie.genres.join(' / ')}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="tabular-nums">{featuredMovie.duration}m</span>
                </span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] text-balance">
                {featuredMovie.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed line-clamp-3">
                {featuredMovie.description}
              </p>

              {/* Rating & Classification */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900/90 border border-neutral-800 text-amber-400 text-sm font-bold shadow-md">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">{featuredMovie.rating.toFixed(1)} / 10</span>
                </div>
                <span className="text-xs text-neutral-400 font-semibold border border-neutral-800 px-2 py-1 rounded bg-neutral-900">
                  {featuredMovie.ageClassification}
                </span>
                <span className="text-xs text-neutral-400">
                  Dir. {featuredMovie.director}
                </span>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex items-center gap-4 pt-3 flex-wrap">
                <button
                  onClick={() => onBookMovie(featuredMovie)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-red-950 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets Now</span>
                </button>
                <button
                  onClick={() => onSelectMovie(featuredMovie)}
                  className="px-5 py-3 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  <span>Movie Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Currently Showing Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>Currently In Theatres</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Browse critically acclaimed movies currently showing across IMAX and Dolby auditoriums
              </p>
            </div>

            {/* Interactive Genre Filters */}
            {genres.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      selectedGenre === g
                        ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                        : 'bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-900 animate-pulse border border-neutral-800" />
              ))}
            </div>
          ) : filteredNowShowing.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
              <p className="text-sm font-medium text-neutral-300">No movies found under genre "{selectedGenre}"</p>
              <button
                onClick={() => setSelectedGenre('All')}
                className="text-xs text-red-400 hover:underline"
              >
                Reset genre filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredNowShowing.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  onSelect={onSelectMovie}
                  onBookNow={onBookMovie}
                />
              ))}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => onNavigate('movies')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-colors"
            >
              <span>Explore All Running Titles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Upcoming Premieres Section */}
        {upcoming.length > 0 && (
          <section className="space-y-6 border-t border-neutral-900 pt-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Upcoming Premieres</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Anticipated theatrical releases coming soon to IMovies screens
                </p>
              </div>

              <button
                onClick={() => onNavigate('upcoming')}
                className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View Full Schedule</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {upcoming.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  onSelect={onSelectMovie}
                  onBookNow={onSelectMovie}
                />
              ))}
            </div>
          </section>
        )}

        {/* Cinema Experience & Auditoriums */}
        <section className="border-t border-neutral-900 pt-12">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
              THE IMOVIES STANDARD
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Next-Generation Theatrical Projection
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every auditorium is acoustically calibrated with custom surround sound arrays and laser projection engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 font-extrabold text-sm">
                ATMOS
              </div>
              <h3 className="text-base font-bold text-white">Dolby Atmos Audio</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                64-channel spatial sound moving fluidly around the auditorium, allowing you to hear every whisper and explosion in dimensional clarity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-sm">
                IMAX
              </div>
              <h3 className="text-base font-bold text-white">IMAX with Dual Laser</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Custom aspect ratios offering up to 26% more picture than standard auditoriums, paired with high-contrast laser clarity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white font-extrabold text-sm">
                VIP
              </div>
              <h3 className="text-base font-bold text-white">Velvet Recliner Suites</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Motorized leather recliners with personal service buttons, gourmet artisanal dining delivered directly to your reserved seat.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
