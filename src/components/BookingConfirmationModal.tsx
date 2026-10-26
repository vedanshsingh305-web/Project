import React from 'react';
import { CheckCircle2, Ticket, Printer, MapPin, Calendar, Clock, Film, X, QrCode } from 'lucide-react';
import { Booking } from '../types';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
  onViewBookings: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  onViewBookings,
}) => {
  if (!booking) return null;

  const showDate = new Date(booking.showtime?.startTime || booking.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const showTime = new Date(booking.showtime?.startTime || booking.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-b from-red-950/60 via-neutral-950 to-neutral-900 border-b border-neutral-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-900/40">
            <CheckCircle2 className="w-6 h-6 text-red-400" />
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight">Booking Confirmed!</h3>
          <p className="text-xs text-neutral-400 mt-1">Your cinema pass has been reserved and stored.</p>
        </div>

        {/* Digital Ticket Pass Card */}
        <div className="p-6 space-y-6">
          <div className="relative bg-neutral-950 rounded-2xl border border-neutral-800 p-5 overflow-hidden shadow-inner">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-850">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-extrabold tracking-widest block">
                  BOOKING REFERENCE
                </span>
                <span className="text-2xl font-black text-amber-400 tracking-wider font-mono">
                  {booking.bookingReference}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-500 uppercase font-extrabold tracking-widest block">
                  STATUS
                </span>
                <span className="inline-block mt-0.5 text-xs font-bold text-emerald-400">
                  CONFIRMED & PAID
                </span>
              </div>
            </div>

            {/* Movie info */}
            <div className="py-4 border-b border-neutral-850 flex items-center gap-4">
              {booking.movie?.posterUrl && (
                <div className="w-14 aspect-[3/4] rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-800">
                  <img src={booking.movie.posterUrl} alt={booking.movie.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-base font-extrabold text-white line-clamp-1">{booking.movie?.title}</h4>
                <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{booking.theatre?.name}</span>
                </div>
                <div className="text-xs text-neutral-400 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    <span>{showDate}</span>
                  </span>
                  <span className="flex items-center gap-1 text-neutral-300 font-medium">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>{showTime}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Seat & Screen Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-850 text-xs">
              <div>
                <span className="text-neutral-500 block uppercase font-bold text-[10px]">Auditorium / Screen</span>
                <span className="font-semibold text-white mt-0.5 block">{booking.screen?.name || 'Screen 1'}</span>
                <span className="text-neutral-500 text-[11px]">{booking.screen?.screenType || 'Dolby Cinema'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase font-bold text-[10px]">Reserved Seats ({booking.seats.length})</span>
                <span className="font-extrabold text-red-400 text-sm mt-0.5 block">
                  {booking.seats.map((s) => s.seatId).join(', ')}
                </span>
                <span className="text-neutral-500 text-[11px]">{booking.seats[0]?.category?.toUpperCase()}</span>
              </div>
            </div>

            {/* QR Code and customer footer */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Ticket Holder</span>
                <span className="text-xs font-semibold text-white">{booking.customerName}</span>
                <span className="text-[11px] text-neutral-500 block">{booking.customerEmail}</span>
                <span className="text-xs text-neutral-400 mt-2 block font-medium">
                  Total Paid: <span className="text-white font-bold tabular-nums">${booking.totalAmount.toFixed(2)}</span>
                </span>
              </div>

              {/* Simulated Cinema Scanner QR Code */}
              <div className="w-20 h-20 bg-white rounded-lg p-1.5 flex flex-col items-center justify-center shadow-md">
                <QrCode className="w-full h-full text-black" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-850 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onViewBookings();
              }}
              className="flex-1 w-full py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-950 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Ticket className="w-4 h-4" />
              <span>View In My Bookings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
