import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Loader2, X, RefreshCw } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from '../components/MovieCard';
import { api } from '../services/api';

interface MoviesPageProps {
  initialStatus?: string;
  onSelectMovie: (movie: Movie) => void;
  onBookMovie: (movie: Movie) => void;
}

export const MoviesPage: React.FC<MoviesPageProps> = ({
  initialStatus = 'now_showing',
  onSelectMovie,
  onBookMovie,
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('rating');

  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  // Fetch movies based on filters
  const fetchMovies = () => {
    setLoading(true);
    const params: any = {
      search: searchTerm,
      genre: genreFilter,
      language: languageFilter,
      sort: sortBy,
      limit: 24,
    };

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    api
      .getMovies(params)
      .then((res) => {
        if (res.success && res.data) {
          setMovies(res.data);
          if (res.meta?.genres) {
            setAvailableGenres(['All', ...res.meta.genres]);
          }
          if (res.meta?.languages) {
            setAvailableLanguages(['All', ...res.meta.languages]);
          }
        }
      })
      .catch((err) => console.error('Failed to query movies:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, genreFilter, languageFilter, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGenreFilter('All');
    setLanguageFilter('All');
    setSortBy('rating');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Theatrical Catalog</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Explore active cinema releases, screening schedules, and upcoming premieres
          </p>
        </div>

        {/* Search input with live icon */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search movie title, cast, or director..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:border-red-500 focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Releases
            </button>
            <button
              onClick={() => setStatusFilter('now_showing')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'now_showing' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'upcoming' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Upcoming
            </button>
          </div>

          {/* Genre Dropdown */}
          {availableGenres.length > 0 && (
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs focus:border-red-500 focus:outline-none"
            >
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  Genre: {g}
                </option>
              ))}
            </select>
          )}

          {/* Language Dropdown */}
          {availableLanguages.length > 0 && (
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs focus:border-red-500 focus:outline-none"
            >
              {availableLanguages.map((l) => (
                <option key={l} value={l}>
                  Language: {l}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs focus:border-red-500 focus:outline-none"
          >
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
            <option value="releaseDate">Release Date</option>
            <option value="title">Movie Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Movie Results */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400 text-sm">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span>Searching cinema database...</span>
        </div>
      ) : movies.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4 max-w-md mx-auto">
          <Filter className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No matching titles found</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            We couldn't find any movies matching your current search query and filter criteria.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Showing {movies.length} title(s)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onSelect={onSelectMovie}
                onBookNow={onBookMovie}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
