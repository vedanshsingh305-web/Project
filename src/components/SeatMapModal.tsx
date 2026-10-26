import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Showtime, SeatDefinition, Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface SeatMapModalProps {
  showtime: Showtime | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({
  showtime,
  onClose,
  onBookingSuccess,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [seats, setSeats] = useState<SeatDefinition[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [screenInfo, setScreenInfo] = useState<any>(null);

  // Reservation hold timer
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Checkout form step
  const [checkoutStep, setCheckoutStep] = useState<'seats' | 'payment'>('seats');
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<string>('CARD');

  // Load seat layout and live status
  const loadSeatMap = async () => {
    if (!showtime) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.getShowtimeSeats(showtime._id);
      if (res.success && res.data) {
        setSeats(res.data.seats);
        setScreenInfo(res.data.screen);

        if (res.data.myHeldSeats && res.data.myHeldSeats.length > 0) {
          setSelectedSeatIds(res.data.myHeldSeats);
        }

        if (res.data.reservationExpiresAt) {
          const exp = new Date(res.data.reservationExpiresAt);
          setHoldExpiresAt(exp);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load seat layout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeatMap();
  }, [showtime]);

  // Countdown timer effect
  useEffect(() => {
    if (!holdExpiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        setHoldExpiresAt(null);
        setSelectedSeatIds([]);
        setErrorMessage('Your temporary seat reservation has expired. Please select seats again.');
        loadSeatMap();
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  if (!showtime) return null;

  // Group seats by row
  const rowsMap: Record<string, SeatDefinition[]> = {};
  seats.forEach((seat) => {
    if (!rowsMap[seat.row]) {
      rowsMap[seat.row] = [];
    }
    rowsMap[seat.row].push(seat);
  });
  const rowLabels = Object.keys(rowsMap).sort();

  // Toggle seat selection
  const handleSeatClick = async (seat: SeatDefinition) => {
    if (seat.status === 'booked' || seat.status === 'held_by_other') {
      return;
    }

    setErrorMessage(null);
    let newSelected: string[];

    if (selectedSeatIds.includes(seat.seatId)) {
      newSelected = selectedSeatIds.filter((id) => id !== seat.seatId);
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMessage('You can select a maximum of 8 seats per booking.');
        return;
      }
      newSelected = [...selectedSeatIds, seat.seatId];
    }

    setSelectedSeatIds(newSelected);

    // If seats are selected, update temporary reservation on server
    if (newSelected.length > 0) {
      try {
        const res = await api.reserveSeats(showtime._id, newSelected);
        if (res.success) {
          setHoldExpiresAt(new Date(res.expiresAt));
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Seat could not be reserved.');
        // Reload seat map to get updated availability
        loadSeatMap();
      }
    } else {
      // Released all
      api.releaseSeats(showtime._id).catch(() => {});
      setHoldExpiresAt(null);
    }
  };

  // Pricing calculations
  const selectedSeatsList = seats.filter((s) => selectedSeatIds.includes(s.seatId));
  const subtotal = selectedSeatsList.reduce((sum, s) => sum + (s.price || showtime.basePrice), 0);
  const bookingFee = selectedSeatsList.length > 0 ? 2.0 : 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const totalAmount = Math.round((subtotal + bookingFee + tax) * 100) / 100;

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Proceed to payment step
  const handleProceedToPayment = () => {
    if (selectedSeatIds.length === 0) {
      setErrorMessage('Please select at least one seat to continue.');
      return;
    }

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setCustomerName(user?.name || '');
    setCustomerEmail(user?.email || '');
    setCustomerPhone(user?.phone || '');
    setCheckoutStep('payment');
  };

  // Confirm booking & finalize transaction
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeatIds.length === 0) return;

    if (!customerName || !customerEmail) {
      setErrorMessage('Please provide your name and email address.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.createBooking({
        showtimeId: showtime._id,
        seatIds: selectedSeatIds,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
      });

      if (res.success && res.data) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E50914', '#F59E0B', '#FFFFFF'],
        });

        onClose();
        onBookingSuccess(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking confirmation failed. Please try again.');
      setCheckoutStep('seats');
      loadSeatMap();
    } finally {
      setSubmitting(false);
    }
  };

  const showtimeDate = new Date(showtime.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const showtimeTime = new Date(showtime.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-white font-semibold">{showtime.movie?.title}</span>
              <span>·</span>
              <span>{showtime.theatre?.name}</span>
              <span>·</span>
              <span className="text-red-400 font-medium">{showtimeDate} at {showtimeTime}</span>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight mt-0.5">
              {checkoutStep === 'seats' ? 'Choose Your Seats' : 'Booking & Payment Summary'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {holdExpiresAt && secondsRemaining > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                <span>Held: {formatTime(secondsRemaining)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center gap-3 text-neutral-400 text-sm">
              <Loader2 className="w-7 h-7 animate-spin text-red-500" />
              <span>Initializing cinema seating layout...</span>
            </div>
          ) : checkoutStep === 'seats' ? (
            <div className="space-y-8">
              {/* Screen Arc Indicator */}
              <div className="flex flex-col items-center select-none pt-2">
                <div className="w-3/4 max-w-md h-3 rounded-t-full bg-gradient-to-b from-red-500/70 via-red-500/20 to-transparent shadow-lg shadow-red-500/20" />
                <div className="w-2/3 max-w-sm h-[1px] bg-red-400/80 mb-2" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                  CINEMA SCREEN
                </span>
              </div>

              {/* Seating Grid */}
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[540px] flex flex-col items-center gap-2.5 select-none">
                  {rowLabels.map((row) => (
                    <div key={row} className="flex items-center gap-3">
                      {/* Row Label Left */}
                      <span className="w-5 text-right font-bold text-xs text-neutral-400">
                        {row}
                      </span>

                      {/* Seats in Row */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {rowsMap[row].map((seat) => {
                          const isSelected = selectedSeatIds.includes(seat.seatId);
                          const isBooked = seat.status === 'booked';
                          const isHeldByOther = seat.status === 'held_by_other';

                          let seatClasses =
                            'relative w-7 h-7 sm:w-8 sm:h-8 rounded-t-md rounded-b text-[10px] sm:text-xs font-bold transition-all duration-150 flex items-center justify-center cursor-pointer ';

                          if (isSelected) {
                            seatClasses +=
                              'bg-red-600 text-white shadow-md shadow-red-600/50 scale-105 border border-red-400';
                          } else if (isBooked) {
                            seatClasses +=
                              'bg-neutral-800/80 text-neutral-600 border border-neutral-800 cursor-not-allowed opacity-40';
                          } else if (isHeldByOther) {
                            seatClasses +=
                              'bg-amber-950/40 text-amber-500/60 border border-amber-600/40 cursor-not-allowed';
                          } else {
                            // Available colors by tier
                            if (seat.category === 'vip') {
                              seatClasses +=
                                'bg-neutral-900 border border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-neutral-800';
                            } else if (seat.category === 'premium') {
                              seatClasses +=
                                'bg-neutral-900 border border-neutral-600 text-neutral-300 hover:border-neutral-400 hover:bg-neutral-800';
                            } else {
                              seatClasses +=
                                'bg-neutral-900 border border-neutral-750 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800';
                            }
                          }

                          return (
                            <button
                              key={seat.seatId}
                              type="button"
                              onClick={() => handleSeatClick(seat)}
                              disabled={isBooked || isHeldByOther}
                              title={`${seat.seatId} · ${seat.category.toUpperCase()} · $${(
                                seat.price || showtime.basePrice
                              ).toFixed(2)}`}
                              className={seatClasses}
                            >
                              <span>{seat.number}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Row Label Right */}
                      <span className="w-5 text-left font-bold text-xs text-neutral-400">
                        {row}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seat Legend */}
              <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-neutral-900 border border-neutral-600" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600 border border-red-400 shadow-sm shadow-red-600/50" />
                  <span className="text-white font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-950/60 border border-amber-600/50" />
                  <span className="text-amber-400">Held (Temp)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-neutral-800/60 border border-neutral-800 opacity-40" />
                  <span className="text-neutral-500">Booked</span>
                </div>
              </div>

              {/* Tiers Pricing Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs">
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400">Standard Tier</span>
                  <span className="font-bold text-white tabular-nums">${showtime.pricing?.standard?.toFixed(2) || '15.00'}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700">
                  <span className="text-neutral-300 font-medium">Premium Tier</span>
                  <span className="font-bold text-white tabular-nums">${showtime.pricing?.premium?.toFixed(2) || '19.50'}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-neutral-900 border border-amber-500/40">
                  <span className="text-amber-400 font-semibold">VIP Recliner</span>
                  <span className="font-bold text-amber-400 tabular-nums">${showtime.pricing?.vip?.toFixed(2) || '26.00'}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Checkout & Payment Step */
            <form onSubmit={handleConfirmBooking} className="max-w-2xl mx-auto space-y-6">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h4 className="text-sm font-bold text-white">Booking Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Movie</span>
                    <span className="text-white font-medium">{showtime.movie?.title}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Cinema</span>
                    <span className="text-white font-medium">{showtime.theatre?.name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Date & Time</span>
                    <span className="text-white font-medium">{showtimeDate} · {showtimeTime}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Selected Seats</span>
                    <span className="text-red-400 font-bold">{selectedSeatIds.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Payment Method</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === 'CARD'
                        ? 'bg-red-950/30 border-red-500/80 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="CARD"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                      className="text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold block">Credit / Debit Card</span>
                      <span className="text-[10px] text-neutral-500">Visa, Mastercard</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === 'SANDBOX_PAY'
                        ? 'bg-red-950/30 border-red-500/80 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="SANDBOX_PAY"
                      checked={paymentMethod === 'SANDBOX_PAY'}
                      onChange={() => setPaymentMethod('SANDBOX_PAY')}
                      className="text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold block">Instant Sandbox Pay</span>
                      <span className="text-[10px] text-amber-500">1-Click Test Mode</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === 'DIGITAL_WALLET'
                        ? 'bg-red-950/30 border-red-500/80 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="DIGITAL_WALLET"
                      checked={paymentMethod === 'DIGITAL_WALLET'}
                      onChange={() => setPaymentMethod('DIGITAL_WALLET')}
                      className="text-red-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold block">Digital Wallet</span>
                      <span className="text-[10px] text-neutral-500">Apple / Google Pay</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Breakdown Summary */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Tickets ({selectedSeatIds.length}x)</span>
                  <span className="tabular-nums font-medium text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Online Convenience Fee</span>
                  <span className="tabular-nums font-medium text-white">${bookingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>State Entertainment Tax (8%)</span>
                  <span className="tabular-nums font-medium text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-neutral-800 pt-2 flex justify-between text-sm font-extrabold text-white">
                  <span>Total Payable</span>
                  <span className="text-red-400 tabular-nums">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('seats')}
                  className="px-4 py-2.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition-colors"
                >
                  Back to Seat Map
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xl shadow-red-950 flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Reservation in MongoDB...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay & Confirm Booking (${totalAmount.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sticky Bottom Summary Bar in Seat View */}
        {checkoutStep === 'seats' && (
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[11px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Seats Selected ({selectedSeatIds.length})
                </span>
                <span className="text-sm font-extrabold text-white">
                  {selectedSeatIds.length > 0 ? selectedSeatIds.join(', ') : 'None selected'}
                </span>
              </div>
              {selectedSeatIds.length > 0 && (
                <div className="h-8 w-[1px] bg-neutral-800 hidden sm:block" />
              )}
              {selectedSeatIds.length > 0 && (
                <div>
                  <span className="text-[11px] text-neutral-500 block uppercase font-bold tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-sm font-extrabold text-red-400 tabular-nums">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={selectedSeatIds.length === 0}
                className="py-2.5 px-6 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-lg shadow-red-950 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Proceed to Checkout</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
