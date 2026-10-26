import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { TheatresPage } from './pages/TheatresPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { SeatMapModal } from './components/SeatMapModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { AuthModal } from './components/AuthModal';
import { Movie, Showtime, Booking } from './types';

function AppContent() {
  const { user, isAuthenticated, isAdmin, openAuthModal } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const handleTabChange = (tab: string) => {
    if (tab === 'dashboard' && !isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (tab === 'admin' && !isAdmin) {
      openAuthModal('login');
      return;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleBookMovie = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleSelectShowtime = (showtime: Showtime) => {
    setSelectedMovie(null);
    setSelectedShowtime(showtime);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setSelectedShowtime(null);
    setConfirmedBooking(booking);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar currentTab={currentTab} setCurrentTab={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onSelectMovie={handleSelectMovie}
            onBookMovie={handleBookMovie}
            onNavigate={handleTabChange}
          />
        )}

        {currentTab === 'movies' && (
          <MoviesPage
            initialStatus="now_showing"
            onSelectMovie={handleSelectMovie}
            onBookMovie={handleBookMovie}
          />
        )}

        {currentTab === 'upcoming' && (
          <MoviesPage
            initialStatus="upcoming"
            onSelectMovie={handleSelectMovie}
            onBookMovie={handleBookMovie}
          />
        )}

        {currentTab === 'theatres' && <TheatresPage />}

        {currentTab === 'dashboard' && (
          <CustomerDashboard onBrowseMovies={() => handleTabChange('movies')} />
        )}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleTabChange} />

      {/* Modals & Dialogs */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSelectShowtime={handleSelectShowtime}
        />
      )}

      {selectedShowtime && (
        <SeatMapModal
          showtime={selectedShowtime}
          onClose={() => setSelectedShowtime(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
          onViewBookings={() => {
            setConfirmedBooking(null);
            handleTabChange('dashboard');
          }}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
