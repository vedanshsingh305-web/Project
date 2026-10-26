import React from 'react';
import { Film } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-neutral-900 bg-neutral-950 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base tracking-tight">
              <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-white" />
              </div>
              <span><span className="text-red-500">I</span>MOVIES</span>
            </div>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
              Premier online cinema ticketing system featuring real-time seat reservation, Dolby Cinema, and IMAX experiences.
            </p>
          </div>

          <div>
            <h4 className="text-neutral-200 font-semibold mb-3 text-xs tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">Home Experience</button></li>
              <li><button onClick={() => onNavigate('movies')} className="hover:text-white transition-colors">Now Showing</button></li>
              <li><button onClick={() => onNavigate('upcoming')} className="hover:text-white transition-colors">Upcoming Premieres</button></li>
              <li><button onClick={() => onNavigate('theatres')} className="hover:text-white transition-colors">Cinema Locations</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-neutral-200 font-semibold mb-3 text-xs tracking-wider uppercase">Booking & Support</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>Cancellation Policy (up to 60m before show)</li>
              <li>Dolby Atmos & IMAX Specifications</li>
              <li>Gift Cards & Corporate Bookings</li>
              <li>Customer Care: support@imovies.com</li>
            </ul>
          </div>

          <div>
            <h4 className="text-neutral-200 font-semibold mb-3 text-xs tracking-wider uppercase">Security & Standards</h4>
            <p className="text-neutral-500 leading-relaxed mb-3">
              All transactions are secured with end-to-end tokenization and verified concurrency control.
            </p>
            <div className="text-[11px] text-neutral-500">
              Protected by IMovies Concurrency Engine
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500">
          <p>© 2026 IMovies Entertainment Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Notice</span>
            <span>·</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-neutral-400 cursor-pointer">Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
