import React, { useState } from 'react';
import { Film, User as UserIcon, LogOut, Ticket, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2.5 text-left text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-500/40">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="tracking-tighter">
            <span className="text-red-500">I</span>MOVIES
          </span>
        </button>

        {/* Zone 2: 4-5 concise nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          <button
            onClick={() => setCurrentTab('home')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'home'
                ? 'text-white border-red-500 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentTab('movies')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'movies'
                ? 'text-white border-red-500 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setCurrentTab('upcoming')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'upcoming'
                ? 'text-white border-red-500 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setCurrentTab('theatres')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              currentTab === 'theatres'
                ? 'text-white border-red-500 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Cinemas
          </button>
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentTab === 'admin'
                  ? 'text-amber-400 border-amber-400 font-semibold'
                  : 'border-transparent text-amber-500/80 hover:text-amber-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action or user profile */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-200 hover:border-neutral-700 transition-colors whitespace-nowrap"
              >
                <div className="w-6 h-6 rounded-full bg-red-950 border border-red-700/60 flex items-center justify-center text-xs font-bold text-red-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-1.5 z-40 text-sm text-neutral-200">
                    <div className="px-4 py-2 border-b border-neutral-800/80">
                      <p className="font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-amber-400">
                          Administrator
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setCurrentTab('dashboard');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-800/60 flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-neutral-400" />
                      <span>My Bookings</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('dashboard');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-800/60 flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-400" />
                      <span>Account Profile</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-neutral-800/60 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Admin Console</span>
                      </button>
                    )}
                    <div className="border-t border-neutral-800 my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-950/40 flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 shadow-md shadow-red-950 transition-colors whitespace-nowrap"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
