export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  createdAt?: string;
  bookingCount?: number;
}

export interface Movie {
  _id: string;
  title: string;
  description: string;
  genres: string[];
  language: string;
  duration: number; // in minutes
  releaseDate: string;
  releaseStatus: 'now_showing' | 'upcoming';
  rating: number;
  ageClassification: string;
  director: string;
  cast: string[];
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  featured?: boolean;
  active: boolean;
}

export interface Theatre {
  _id: string;
  name: string;
  address: string;
  city: string;
  contactPhone?: string;
  facilities: string[];
  screens?: Screen[];
}

export interface SeatDefinition {
  seatId: string;
  row: string;
  number: number;
  category: 'standard' | 'premium' | 'vip';
  priceMultiplier?: number;
  price?: number;
  status?: 'available' | 'booked' | 'held_by_other' | 'held_by_you';
}

export interface Screen {
  _id: string;
  theatre: string | Theatre;
  screenNumber: number;
  name: string;
  screenType: 'Standard' | 'IMAX 3D' | 'Dolby Cinema' | 'VIP Lounge';
  rows: string[];
  seatsPerRow: number;
  seats: SeatDefinition[];
  totalSeats: number;
}

export interface Showtime {
  _id: string;
  movie: Movie;
  theatre: Theatre;
  screen: Screen;
  startTime: string;
  endTime: string;
  basePrice: number;
  pricing: {
    standard: number;
    premium: number;
    vip: number;
  };
  status: 'scheduled' | 'cancelled' | 'completed';
  cancellationCutoffMinutes?: number;
}

export interface BookedSeat {
  seatId: string;
  row: string;
  number: number;
  category: 'standard' | 'premium' | 'vip';
  price: number;
}

export interface Booking {
  _id: string;
  bookingReference: string;
  user: string | User;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  movie: Movie;
  theatre: Theatre;
  screen: Screen;
  showtime: Showtime;
  seats: BookedSeat[];
  subtotal: number;
  bookingFee: number;
  tax: number;
  totalAmount: number;
  bookingStatus: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  paymentReference?: string;
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface AdminStats {
  totalMovies: number;
  totalTheatres: number;
  totalScreens: number;
  upcomingShowtimes: number;
  totalUsers: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalTicketsSold: number;
  recentBookings: Booking[];
}
