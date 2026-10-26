import { Movie, Theatre, Showtime, Booking, User, AdminStats } from '../types';

const API_BASE = '/api';

// Maintain a client session id in localStorage for temporary seat reservations
function getSessionId(): string {
  let sid = localStorage.getItem('imovies_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('imovies_session_id', sid);
  }
  return sid;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('imovies_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid response from server' }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ success: boolean; token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (payload: any) => request<{ success: boolean; token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getMe: () => request<{ success: boolean; user: User }>('/auth/me'),
  updateProfile: (payload: { name: string; phone?: string }) => request<{ success: boolean; user: User }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => request<{ success: boolean; message: string }>('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  // Movies
  getMovies: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return request<{ success: boolean; data: Movie[]; meta: any }>(`/movies?${query.toString()}`);
  },
  getMovieById: (id: string) => request<{ success: boolean; data: { movie: Movie; showtimes: Showtime[] } }>(`/movies/${id}`),
  createMovie: (payload: any) => request<{ success: boolean; data: Movie }>('/movies', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateMovie: (id: string, payload: any) => request<{ success: boolean; data: Movie }>(`/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteMovie: (id: string) => request<{ success: boolean; message: string }>(`/movies/${id}`, {
    method: 'DELETE',
  }),

  // Theatres
  getTheatres: () => request<{ success: boolean; data: Theatre[] }>('/theatres'),
  createTheatre: (payload: any) => request<{ success: boolean; data: Theatre }>('/theatres', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Showtimes
  getShowtimes: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) query.append(key, String(val));
    });
    return request<{ success: boolean; data: Showtime[] }>(`/showtimes?${query.toString()}`);
  },
  createShowtime: (payload: any) => request<{ success: boolean; data: Showtime }>('/showtimes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  deleteShowtime: (id: string) => request<{ success: boolean; message: string }>(`/showtimes/${id}`, {
    method: 'DELETE',
  }),

  // Seats & Reservations
  getShowtimeSeats: (showtimeId: string) => request<{
    success: boolean;
    data: {
      showtime: any;
      screen: any;
      seats: any[];
      myHeldSeats: string[];
      reservationExpiresAt?: string;
    };
  }>(`/showtimes/${showtimeId}/seats`),

  reserveSeats: (showtimeId: string, seatIds: string[]) => request<{
    success: boolean;
    message: string;
    heldSeats: string[];
    expiresAt: string;
  }>(`/showtimes/${showtimeId}/reserve-seats`, {
    method: 'POST',
    body: JSON.stringify({ seatIds, sessionId: getSessionId() }),
  }),

  releaseSeats: (showtimeId: string) => request<{ success: boolean; message: string }>(`/showtimes/${showtimeId}/release-seats`, {
    method: 'POST',
    body: JSON.stringify({ sessionId: getSessionId() }),
  }),

  // Bookings
  createBooking: (payload: {
    showtimeId: string;
    seatIds: string[];
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    paymentMethod: string;
  }) => request<{ success: boolean; message: string; data: Booking }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getMyBookings: () => request<{ success: boolean; data: Booking[] }>('/bookings/my'),
  getBookingById: (id: string) => request<{ success: boolean; data: Booking }>(`/bookings/${id}`),
  cancelBooking: (id: string, reason?: string) => request<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  // Admin
  getAdminStats: () => request<{ success: boolean; data: AdminStats }>('/admin/stats'),
  getAdminBookings: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) query.append(key, String(val));
    });
    return request<{ success: boolean; data: Booking[]; meta: any }>(`/admin/bookings?${query.toString()}`);
  },
  getAdminUsers: () => request<{ success: boolean; data: User[] }>('/admin/users'),
  reseedDatabase: () => request<{ success: boolean; message: string }>('/admin/reseed', {
    method: 'POST',
  }),
};
