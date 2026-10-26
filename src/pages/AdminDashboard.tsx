import React, { useState, useEffect } from 'react';
import {
  Film,
  Calendar,
  Ticket,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { AdminStats, Movie, Theatre, Showtime, Booking, User } from '../types';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'showtimes' | 'bookings' | 'users'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Movies list & form
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showAddMovieModal, setShowAddMovieModal] = useState<boolean>(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genres: 'Action, Sci-Fi',
    language: 'English',
    duration: 120,
    releaseDate: new Date().toISOString().split('T')[0],
    releaseStatus: 'now_showing',
    rating: 8.5,
    ageClassification: 'PG-13',
    director: '',
    posterUrl: '/src/assets/images/poster_quantum_horizon_1792597454046.jpg',
    backdropUrl: '/src/assets/images/hero_movie_sci_fi_1792597453242.jpg',
  });

  // Theatres & Showtimes
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [showAddShowtimeModal, setShowAddShowtimeModal] = useState<boolean>(false);
  const [showtimeForm, setShowtimeForm] = useState({
    movie: '',
    theatre: '',
    screen: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    basePrice: 15.0,
  });

  // Bookings list & search
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');

  // Users list
  const [usersList, setUsersList] = useState<User[]>([]);

  // Reseed state
  const [reseeding, setReseeding] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, moviesRes, theatresRes, showtimesRes, bookingsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getMovies({ limit: 50 }),
        api.getTheatres(),
        api.getShowtimes(),
        api.getAdminBookings({ limit: 50 }),
        api.getAdminUsers(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (moviesRes.success) setMovies(moviesRes.data);
      if (theatresRes.success) setTheatres(theatresRes.data);
      if (showtimesRes.success) setShowtimes(showtimesRes.data);
      if (bookingsRes.success) setAllBookings(bookingsRes.data);
      if (usersRes.success) setUsersList(usersRes.data);
    } catch (err) {
      console.error('Failed to load admin dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle Add/Edit Movie Submit
  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    try {
      const payload = {
        ...movieForm,
        genres: movieForm.genres.split(',').map((g) => g.trim()),
        duration: Number(movieForm.duration),
        rating: Number(movieForm.rating),
        releaseDate: new Date(movieForm.releaseDate),
      };

      if (editingMovie) {
        await api.updateMovie(editingMovie._id, payload);
        setActionFeedback({ type: 'success', message: 'Movie updated successfully!' });
      } else {
        await api.createMovie(payload);
        setActionFeedback({ type: 'success', message: 'New movie added to catalog!' });
      }

      setShowAddMovieModal(false);
      setEditingMovie(null);
      fetchAllData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to save movie.' });
    }
  };

  // Delete Movie
  const handleDeleteMovie = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"? This will also remove scheduled showtimes.`)) {
      return;
    }
    try {
      await api.deleteMovie(id);
      setActionFeedback({ type: 'success', message: `Movie "${title}" removed successfully.` });
      fetchAllData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to delete movie.' });
    }
  };

  // Handle Create Showtime Submit
  const handleShowtimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);

    const startDateTime = new Date(`${showtimeForm.startDate}T${showtimeForm.startTime}:00.000Z`);
    // Find movie duration
    const mov = movies.find((m) => m._id === showtimeForm.movie);
    const durationMins = mov ? mov.duration : 130;
    const endDateTime = new Date(startDateTime.getTime() + durationMins * 60 * 1000);

    try {
      await api.createShowtime({
        movie: showtimeForm.movie,
        theatre: showtimeForm.theatre,
        screen: showtimeForm.screen,
        startTime: startDateTime,
        endTime: endDateTime,
        basePrice: Number(showtimeForm.basePrice),
      });

      setActionFeedback({ type: 'success', message: 'Showtime scheduled successfully.' });
      setShowAddShowtimeModal(false);
      fetchAllData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to schedule showtime.' });
    }
  };

  // Delete Showtime
  const handleDeleteShowtime = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this showtime?')) return;
    try {
      await api.deleteShowtime(id);
      setActionFeedback({ type: 'success', message: 'Showtime deleted.' });
      fetchAllData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to delete showtime.' });
    }
  };

  // Cancel any booking as Admin
  const handleAdminCancelBooking = async (id: string) => {
    if (!window.confirm('Cancel this booking and release seats?')) return;
    try {
      await api.cancelBooking(id, 'Cancelled by Administrator');
      setActionFeedback({ type: 'success', message: 'Booking cancelled and seats released.' });
      fetchAllData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to cancel booking.' });
    }
  };

  // Reset & Reseed Database
  const handleReseed = async () => {
    if (!window.confirm('Reset and reseed database with fresh sample movies, screens, and showtimes?')) {
      return;
    }
    setReseeding(true);
    setActionFeedback(null);
    try {
      const res = await api.reseedDatabase();
      setActionFeedback({ type: 'success', message: res.message });
      await fetchAllData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Reseed failed.' });
    } finally {
      setReseeding(false);
    }
  };

  // Filtered bookings
  const filteredBookings = allBookings.filter((b) => {
    const matchStatus = bookingStatusFilter === 'ALL' || b.bookingStatus === bookingStatusFilter;
    const matchSearch =
      !bookingSearch ||
      b.bookingReference.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customerName.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block mb-1">
            MANAGEMENT CONSOLE
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">IMovies Administration</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Oversee cinema ticketing operations, schedule auditoriums, monitor live bookings, and manage catalog
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="px-3.5 py-2 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {reseeding ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/60 border-red-800/80 text-red-300'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('movies')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'movies' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Movies ({movies.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('showtimes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'showtimes' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Showtimes ({showtimes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'bookings' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Bookings ({allBookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({usersList.length})</span>
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Gross Revenue</span>
              <p className="text-2xl font-black text-amber-400 tabular-nums">
                ${stats?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <span className="text-[11px] text-neutral-500 block">Total ticket turnover</span>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Bookings</span>
              <p className="text-2xl font-black text-white tabular-nums">
                {stats?.totalBookings || 0}
              </p>
              <span className="text-[11px] text-emerald-400 block">{stats?.confirmedBookings || 0} Confirmed</span>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Tickets Issued</span>
              <p className="text-2xl font-black text-white tabular-nums">
                {stats?.totalTicketsSold || 0}
              </p>
              <span className="text-[11px] text-neutral-500 block">Across all screens</span>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Active Showtimes</span>
              <p className="text-2xl font-black text-red-500 tabular-nums">
                {stats?.upcomingShowtimes || 0}
              </p>
              <span className="text-[11px] text-neutral-500 block">{stats?.totalMovies || 0} catalog movies</span>
            </div>
          </div>

          {/* Quick Actions & Recent Bookings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Administrative Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setEditingMovie(null);
                    setShowAddMovieModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Movie</span>
                </button>
                <button
                  onClick={() => setShowAddShowtimeModal(true)}
                  className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span>Schedule Showtime</span>
                </button>
              </div>

              <div className="pt-4 border-t border-neutral-800/80 space-y-2 text-xs text-neutral-400">
                <span className="font-bold text-white block">Audit Summary</span>
                <p>• {theatres.length} Cinema Locations Active</p>
                <p>• Schedule conflict checks enforced automatically</p>
                <p>• Concurrency locks active on all auditorium screens</p>
              </div>
            </div>

            {/* Recent Bookings Feed */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Recent Cinema Bookings</h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs text-red-400 hover:underline"
                >
                  View All ({allBookings.length})
                </button>
              </div>

              {allBookings.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">No bookings recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {allBookings.slice(0, 5).map((b) => (
                    <div
                      key={b._id}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-neutral-400 font-bold">{b.bookingReference}</span>
                          <span className="font-semibold text-white">{b.movie?.title}</span>
                        </div>
                        <p className="text-neutral-500 text-[11px]">
                          {b.customerName} ({b.customerEmail}) · Seats: {b.seats.map((s) => s.seatId).join(', ')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-white block tabular-nums">${b.totalAmount.toFixed(2)}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            b.bookingStatus === 'CONFIRMED' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Movies */}
      {activeTab === 'movies' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Movie Management</h2>
            <button
              onClick={() => {
                setEditingMovie(null);
                setMovieForm({
                  title: '',
                  description: '',
                  genres: 'Action, Sci-Fi',
                  language: 'English',
                  duration: 120,
                  releaseDate: new Date().toISOString().split('T')[0],
                  releaseStatus: 'now_showing',
                  rating: 8.5,
                  ageClassification: 'PG-13',
                  director: '',
                  posterUrl: '/src/assets/images/poster_quantum_horizon_1792597454046.jpg',
                  backdropUrl: '/src/assets/images/hero_movie_sci_fi_1792597453242.jpg',
                });
                setShowAddMovieModal(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Movie</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((m) => (
              <div
                key={m._id}
                className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex gap-4 items-start"
              >
                <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800">
                  <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-sm font-bold text-white truncate">{m.title}</h3>
                  <p className="text-xs text-neutral-400">{m.genres.join(', ')} · {m.duration}m</p>
                  <p className="text-xs text-neutral-500 truncate">Dir. {m.director}</p>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-amber-400 font-bold tabular-nums">★ {m.rating.toFixed(1)}</span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-950">
                      {m.releaseStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingMovie(m);
                        setMovieForm({
                          title: m.title,
                          description: m.description,
                          genres: m.genres.join(', '),
                          language: m.language,
                          duration: m.duration,
                          releaseDate: new Date(m.releaseDate).toISOString().split('T')[0],
                          releaseStatus: m.releaseStatus,
                          rating: m.rating,
                          ageClassification: m.ageClassification,
                          director: m.director,
                          posterUrl: m.posterUrl,
                          backdropUrl: m.backdropUrl,
                        });
                        setShowAddMovieModal(true);
                      }}
                      className="text-xs text-neutral-300 hover:text-white flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <span className="text-neutral-700">·</span>
                    <button
                      onClick={() => handleDeleteMovie(m._id, m.title)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Showtimes */}
      {activeTab === 'showtimes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Showtimes & Schedule</h2>
            <button
              onClick={() => {
                if (movies.length > 0 && theatres.length > 0) {
                  const firstTh = theatres[0];
                  setShowtimeForm({
                    movie: movies[0]._id,
                    theatre: firstTh._id,
                    screen: firstTh.screens && firstTh.screens.length > 0 ? firstTh.screens[0]._id : '',
                    startDate: new Date().toISOString().split('T')[0],
                    startTime: '18:00',
                    basePrice: 15.0,
                  });
                }
                setShowAddShowtimeModal(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Showtime</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-bold text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3.5">Movie</th>
                  <th className="p-3.5">Cinema & Screen</th>
                  <th className="p-3.5">Date & Start Time</th>
                  <th className="p-3.5">Base Price</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {showtimes.map((st) => (
                  <tr key={st._id} className="hover:bg-neutral-850/50">
                    <td className="p-3.5 font-bold text-white">{st.movie?.title}</td>
                    <td className="p-3.5">
                      <span>{st.theatre?.name}</span>
                      <span className="block text-[11px] text-neutral-500">{st.screen?.name}</span>
                    </td>
                    <td className="p-3.5">
                      <span>{new Date(st.startTime).toLocaleDateString()}</span>
                      <span className="block font-bold text-neutral-200">
                        {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3.5 tabular-nums font-medium text-amber-400">${st.basePrice?.toFixed(2)}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-950 text-emerald-400 border border-emerald-900/60 uppercase">
                        {st.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteShowtime(st._id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">All Cinema Reservations</h2>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search reference or email..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-bold text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3.5">Ref</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Movie & Cinema</th>
                  <th className="p-3.5">Seats</th>
                  <th className="p-3.5">Total Paid</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-neutral-850/50">
                    <td className="p-3.5 font-mono font-bold text-amber-400">{b.bookingReference}</td>
                    <td className="p-3.5">
                      <span className="text-white font-semibold block">{b.customerName}</span>
                      <span className="text-neutral-500 text-[11px]">{b.customerEmail}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-white block">{b.movie?.title}</span>
                      <span className="text-neutral-500 text-[11px]">{b.theatre?.name}</span>
                    </td>
                    <td className="p-3.5 font-bold text-red-400">
                      {b.seats.map((s) => s.seatId).join(', ')}
                    </td>
                    <td className="p-3.5 font-bold tabular-nums text-white">${b.totalAmount.toFixed(2)}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'CONFIRMED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                            : 'bg-red-950/80 text-red-400 border border-red-800/80'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {b.bookingStatus === 'CONFIRMED' && (
                        <button
                          onClick={() => handleAdminCancelBooking(b._id)}
                          className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 hover:border-red-800 text-red-400 hover:text-red-300 text-[11px] font-semibold transition-colors"
                        >
                          Cancel / Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white">Registered Users Directory</h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-bold text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Bookings Made</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {usersList.map((u) => (
                  <tr key={u.id || u.email} className="hover:bg-neutral-850/50">
                    <td className="p-3.5 font-bold text-white">{u.name}</td>
                    <td className="p-3.5 text-neutral-400">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-neutral-500">{u.phone || 'N/A'}</td>
                    <td className="p-3.5 font-bold text-white tabular-nums">{u.bookingCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      {showAddMovieModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingMovie ? 'Edit Movie Details' : 'Add New Movie Title'}
            </h3>

            <form onSubmit={handleMovieSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Title</label>
                  <input
                    type="text"
                    required
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Director</label>
                  <input
                    type="text"
                    required
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  required
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={movieForm.genres}
                    onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Duration (mins)</label>
                  <input
                    type="number"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Rating (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Status</label>
                  <select
                    value={movieForm.releaseStatus}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Age Classification</label>
                  <input
                    type="text"
                    value={movieForm.ageClassification}
                    onChange={(e) => setMovieForm({ ...movieForm, ageClassification: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddMovieModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                >
                  {editingMovie ? 'Save Updates' : 'Create Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Showtime Modal */}
      {showAddShowtimeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Schedule Cinema Showtime</h3>

            <form onSubmit={handleShowtimeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">Select Movie</label>
                <select
                  required
                  value={showtimeForm.movie}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, movie: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                >
                  <option value="">-- Choose movie --</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.duration} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Select Cinema</label>
                  <select
                    required
                    value={showtimeForm.theatre}
                    onChange={(e) => {
                      const th = theatres.find((t) => t._id === e.target.value);
                      setShowtimeForm({
                        ...showtimeForm,
                        theatre: e.target.value,
                        screen: th?.screens && th.screens.length > 0 ? th.screens[0]._id : '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  >
                    <option value="">-- Choose cinema --</option>
                    {theatres.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Select Screen</label>
                  <select
                    required
                    value={showtimeForm.screen}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, screen: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  >
                    <option value="">-- Choose screen --</option>
                    {theatres
                      .find((t) => t._id === showtimeForm.theatre)
                      ?.screens?.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.screenType})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={showtimeForm.startDate}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Time</label>
                  <input
                    type="time"
                    required
                    value={showtimeForm.startTime}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={showtimeForm.basePrice}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
              </div>

              <p className="text-[11px] text-neutral-500">
                The system checks for overlapping screenings on the selected screen automatically.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddShowtimeModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
