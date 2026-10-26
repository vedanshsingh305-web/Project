import React, { useState, useEffect } from 'react';
import {
  Ticket,
  User as UserIcon,
  Lock,
  Clock,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Eye,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Booking } from '../types';
import { api } from '../services/api';
import { BookingConfirmationModal } from '../components/BookingConfirmationModal';

interface CustomerDashboardProps {
  onBrowseMovies: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onBrowseMovies }) => {
  const { user, updateProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'password'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile edit state
  const [profileName, setProfileName] = useState<string>(user?.name || '');
  const [profilePhone, setProfilePhone] = useState<string>(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<boolean>(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View ticket modal
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.getMyBookings();
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to load my bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Confirmed seats will be immediately released back to other cinema guests.')) {
      return;
    }

    setCancellingId(bookingId);
    setCancelFeedback(null);

    try {
      const res = await api.cancelBooking(bookingId, 'Customer requested cancellation');
      if (res.success) {
        setCancelFeedback({
          type: 'success',
          message: 'Booking cancelled successfully. Your seats have been released.',
        });
        fetchBookings();
      }
    } catch (err: any) {
      setCancelFeedback({
        type: 'error',
        message: err.message || 'Unable to cancel booking.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      await updateProfile({ name: profileName, phone: profilePhone });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordFeedback({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Failed to change password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Separate active/upcoming vs past/cancelled bookings
  const now = new Date();
  const activeBookings = bookings.filter((b) => {
    const showTime = new Date(b.showtime?.startTime || b.createdAt);
    return b.bookingStatus === 'CONFIRMED' && showTime > now;
  });

  const pastBookings = bookings.filter((b) => {
    const showTime = new Date(b.showtime?.startTime || b.createdAt);
    return b.bookingStatus !== 'CONFIRMED' || showTime <= now;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-xl font-bold text-red-400">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{user?.name}</h1>
            <p className="text-xs text-neutral-400">{user?.email}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold text-neutral-400">
              Role: <span className="capitalize text-neutral-300">{user?.role}</span>
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-850 text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'bookings'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>My Cinema Bookings ({bookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'profile'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'password'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-8">
          {cancelFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                cancelFeedback.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                  : 'bg-red-950/50 border-red-800/80 text-red-300'
              }`}
            >
              {cancelFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{cancelFeedback.message}</span>
            </div>
          )}

          {/* Active Upcoming Passes */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Upcoming Cinema Sessions</span>
            </h2>

            {loadingBookings ? (
              <div className="py-12 flex justify-center items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span>Loading your booking records from database...</span>
              </div>
            ) : activeBookings.length === 0 ? (
              <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center space-y-3">
                <Ticket className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400">You don't have any upcoming cinema bookings.</p>
                <button
                  onClick={onBrowseMovies}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors inline-block"
                >
                  Browse Now Showing Movies
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBookings.map((b) => (
                  <div
                    key={b._id}
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4 flex flex-col justify-between hover:border-neutral-700 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-wider block">
                            REF: {b.bookingReference}
                          </span>
                          <h3 className="text-base font-extrabold text-white">{b.movie?.title}</h3>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                          CONFIRMED
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-neutral-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{b.theatre?.name} ({b.screen?.name || 'Screen 1'})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-neutral-300">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{new Date(b.showtime?.startTime || b.createdAt).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-neutral-300">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{new Date(b.showtime?.startTime || b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-neutral-500 block text-[10px] uppercase font-bold">Seats</span>
                          <span className="font-extrabold text-red-400 text-sm">
                            {b.seats.map((s) => s.seatId).join(', ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-500 block text-[10px] uppercase font-bold">Paid</span>
                          <span className="font-bold text-white text-sm tabular-nums">${b.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80">
                      <button
                        onClick={() => setSelectedTicket(b)}
                        className="flex-1 py-2 px-3 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Ticket Pass</span>
                      </button>
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        disabled={cancellingId === b._id}
                        className="py-2 px-3 rounded-lg bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === b._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past / Cancelled History */}
          {pastBookings.length > 0 && (
            <div className="space-y-4 border-t border-neutral-900 pt-8">
              <h2 className="text-base font-bold text-neutral-300">Past & Cancelled Bookings</h2>
              <div className="space-y-3">
                {pastBookings.map((b) => (
                  <div
                    key={b._id}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-500 font-bold">{b.bookingReference}</span>
                        <span className="font-bold text-white">{b.movie?.title}</span>
                      </div>
                      <p className="text-neutral-500">
                        {b.theatre?.name} · {new Date(b.showtime?.startTime || b.createdAt).toLocaleDateString()} · Seats: {b.seats.map((s) => s.seatId).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.bookingStatus === 'CANCELLED'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                      <button
                        onClick={() => setSelectedTicket(b)}
                        className="text-xs text-neutral-400 hover:text-white underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="max-w-md space-y-4 p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <h2 className="text-base font-bold text-white mb-4">Edit Profile</h2>

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile information updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address (Read-only)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 rounded-lg bg-neutral-950/50 border border-neutral-850 text-neutral-500 text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Phone Number</label>
            <input
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {/* Tab: Password */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4 p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <h2 className="text-base font-bold text-white mb-4">Update Password</h2>

          {passwordFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                passwordFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  : 'bg-red-950/60 border-red-800/80 text-red-300'
              }`}
            >
              {passwordFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {changingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <BookingConfirmationModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onViewBookings={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};
