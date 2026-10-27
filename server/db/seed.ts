import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen, ISeatDefinition } from '../models/Screen.js';
import { Showtime } from '../models/Showtime.js';
import { Booking } from '../models/Booking.js';
import { SeatReservation } from '../models/SeatReservation.js';

export async function seedDatabase(force: boolean = false) {
  const existingMovies = await Movie.countDocuments();
  if (existingMovies > 0 && !force) {
    console.log('Database already contains data. Skipping initial seed.');
    return;
  }

  console.log('Seeding IMovies database with cinema assets and showtimes...');

  // Clear existing collections if force is true
  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Screen.deleteMany({}),
      Showtime.deleteMany({}),
      Booking.deleteMany({}),
      SeatReservation.deleteMany({}),
    ]);
  }

  // 1. Users
  const salt = await bcrypt.genSalt(10);
  const adminEmail = process.env.NODE_ENV === 'production' ? process.env.ADMIN_EMAIL?.trim().toLowerCase() : 'admin@imovies.com';
  const configuredAdminPassword = process.env.NODE_ENV === 'production' ? process.env.ADMIN_PASSWORD : 'AdminPass123!';
  if (!adminEmail || !configuredAdminPassword || configuredAdminPassword.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) before seeding a production database.');
  }
  const adminPassword = await bcrypt.hash(configuredAdminPassword, salt);
  const customerPassword = await bcrypt.hash('UserPass123!', salt);

  const admin = await User.create({
    name: 'Eleanor Vance (Admin)',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    phone: '+1 (555) 019-2834',
  });

  const demoCustomer = await User.create({
    name: 'Marcus Sterling',
    email: 'user@imovies.com',
    password: customerPassword,
    role: 'customer',
    phone: '+1 (555) 432-8921',
  });

  // 2. Theatres
  const grandCineplex = await Theatre.create({
    name: 'IMovies Grand Cinema Downtown',
    address: '742 Broadway Ave, Suite 100',
    city: 'Los Angeles',
    contactPhone: '+1 (213) 555-0182',
    active: true,
    facilities: ['Dolby Atmos', '4K Laser Projection', 'Recliner Seating', 'Gourmet Bar'],
  });

  const starlightMultiplex = await Theatre.create({
    name: 'Starlight IMAX & Laser Multiplex',
    address: '1050 Market Street',
    city: 'San Francisco',
    contactPhone: '+1 (415) 555-0144',
    active: true,
    facilities: ['IMAX with Laser', 'RealD 3D', 'VIP Dining', 'Valet Parking'],
  });

  const velvetLounge = await Theatre.create({
    name: 'The Velvet Screen & Cinema Club',
    address: '420 5th Avenue',
    city: 'New York',
    contactPhone: '+1 (212) 555-0199',
    active: true,
    facilities: ['Dolby Cinema', 'Signature Cocktails', 'Heated Recliners', 'Private Suites'],
  });

  // Helper to generate seat layout
  const buildSeats = (rows: string[], seatsPerRow: number): ISeatDefinition[] => {
    const seats: ISeatDefinition[] = [];
    rows.forEach((row, rowIndex) => {
      let category: 'standard' | 'premium' | 'vip' = 'standard';
      let multiplier = 1.0;
      if (rowIndex >= rows.length - 2) {
        category = 'vip';
        multiplier = 1.6;
      } else if (rowIndex >= 2) {
        category = 'premium';
        multiplier = 1.25;
      }

      for (let num = 1; num <= seatsPerRow; num++) {
        seats.push({
          seatId: `${row}${num}`,
          row,
          number: num,
          category,
          priceMultiplier: multiplier,
        });
      }
    });
    return seats;
  };

  // 3. Screens
  const grandRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const grandSeats = buildSeats(grandRows, 10);
  const screen1 = await Screen.create({
    theatre: grandCineplex._id,
    screenNumber: 1,
    name: 'Auditorium 1 — Dolby Atmos Laser',
    screenType: 'Dolby Cinema',
    rows: grandRows,
    seatsPerRow: 10,
    seats: grandSeats,
    totalSeats: grandSeats.length,
    active: true,
  });

  const imaxRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const imaxSeats = buildSeats(imaxRows, 12);
  const screen2 = await Screen.create({
    theatre: starlightMultiplex._id,
    screenNumber: 1,
    name: 'IMAX Laser Giant Hall',
    screenType: 'IMAX 3D',
    rows: imaxRows,
    seatsPerRow: 12,
    seats: imaxSeats,
    totalSeats: imaxSeats.length,
    active: true,
  });

  const velvetRows = ['A', 'B', 'C', 'D', 'E'];
  const velvetSeats = buildSeats(velvetRows, 8);
  const screen3 = await Screen.create({
    theatre: velvetLounge._id,
    screenNumber: 1,
    name: 'Lounge Hall — Recliner Suite',
    screenType: 'VIP Lounge',
    rows: velvetRows,
    seatsPerRow: 8,
    seats: velvetSeats,
    totalSeats: velvetSeats.length,
    active: true,
  });

  // 4. Movies
  const movie1 = await Movie.create({
    title: 'Quantum Horizon',
    description:
      'A deep space expedition breaches a mysterious gravitational singularity, forcing a team of astrophysicists to navigate fractured timelines and cosmic phenomena to find their path home.',
    genres: ['Sci-Fi', 'Adventure', 'Mystery'],
    language: 'English',
    duration: 148,
    releaseDate: new Date('2026-09-15'),
    releaseStatus: 'now_showing',
    rating: 8.9,
    ageClassification: 'PG-13',
    director: 'Elara Vance',
    cast: ['Kaelen Ryder', 'Eliza Vance', 'David Oyelowo', 'Hannah Gross'],
    posterUrl: '/src/assets/images/poster_quantum_horizon_1792597454046.jpg',
    backdropUrl: '/src/assets/images/hero_movie_sci_fi_1792597453242.jpg',
    trailerUrl: 'https://www.youtube.com',
    featured: true,
    active: true,
  });

  const movie2 = await Movie.create({
    title: 'Shadow Cipher',
    description:
      'In a rain-drenched megalopolis run by digital cartels, an ex-cryptographer discovers a rogue protocol capable of overwriting civilian identities before dawn.',
    genres: ['Thriller', 'Crime', 'Mystery'],
    language: 'English',
    duration: 132,
    releaseDate: new Date('2026-10-02'),
    releaseStatus: 'now_showing',
    rating: 8.6,
    ageClassification: 'R',
    director: 'Eliza Reed',
    cast: ['Liam Chen', 'Maya Patel', 'Elias Thorne', 'Sarah Vo'],
    posterUrl: '/src/assets/images/poster_shadow_cipher_1792597503562.jpg',
    backdropUrl: '/src/assets/images/poster_shadow_cipher_1792597503562.jpg',
    trailerUrl: 'https://www.youtube.com',
    featured: true,
    active: true,
  });

  const movie3 = await Movie.create({
    title: 'Golden Dynasty',
    description:
      'Set against mist-veiled mountain peaks, a sworn order of martial masters defends the ancient celestial archive from an ambitious warlord armed with forgotten black powder.',
    genres: ['Action', 'Drama', 'History'],
    language: 'Mandarin (English Subtitles)',
    duration: 156,
    releaseDate: new Date('2026-09-28'),
    releaseStatus: 'now_showing',
    rating: 8.8,
    ageClassification: 'PG-13',
    director: 'Chen Wei',
    cast: ['Wang Lei', 'Mei Ling', 'Chen Hao', 'Zhang Jie', 'Li Fan'],
    posterUrl: '/src/assets/images/poster_golden_dynasty_1792597456181.jpg',
    backdropUrl: '/src/assets/images/poster_golden_dynasty_1792597456181.jpg',
    trailerUrl: 'https://www.youtube.com',
    featured: false,
    active: true,
  });

  const movie4 = await Movie.create({
    title: 'Neon Velocity',
    description:
      'An underground midnight grand prix across rain-soaked expressways spirals into a high-stakes heist when an experimental supercar prototype becomes the target.',
    genres: ['Action', 'Thriller'],
    language: 'English',
    duration: 118,
    releaseDate: new Date('2026-10-10'),
    releaseStatus: 'now_showing',
    rating: 8.4,
    ageClassification: 'PG-13',
    director: 'Kenji Tanaka',
    cast: ['Alex Reed', 'Sarah Chen', 'Kenji Tanaka', 'Marcus Croft'],
    posterUrl: '/src/assets/images/poster_neon_velocity_1792597478973.jpg',
    backdropUrl: '/src/assets/images/poster_neon_velocity_1792597478973.jpg',
    trailerUrl: 'https://www.youtube.com',
    featured: false,
    active: true,
  });

  const movie5 = await Movie.create({
    title: 'Chronicles of Aethelgard',
    description:
      'An epic fantasy adaptation following the heir to an ancient northern realm who must awaken dormant dragon runes before the eternal solstice falls.',
    genres: ['Fantasy', 'Adventure'],
    language: 'English',
    duration: 165,
    releaseDate: new Date('2026-12-18'),
    releaseStatus: 'upcoming',
    rating: 9.1,
    ageClassification: 'PG-13',
    director: 'Gareth Holm',
    cast: ['Anya Taylor', 'Rowan Davies', 'Hera Hilmar'],
    posterUrl: '/src/assets/images/poster_golden_dynasty_1792597456181.jpg',
    backdropUrl: '/src/assets/images/hero_movie_sci_fi_1792597453242.jpg',
    trailerUrl: 'https://www.youtube.com',
    featured: false,
    active: true,
  });

  const movie6 = await Movie.create({
    title: 'Solaris Eclipse',
    description:
      'A deep space solar station experiences anomalous telemetry as a rare alignment of binary stars reveals a hidden architectural monolith.',
    genres: ['Sci-Fi', 'Mystery'],
    language: 'English',
    duration: 124,
    releaseDate: new Date('2027-01-22'),
    releaseStatus: 'upcoming',
    rating: 8.5,
    ageClassification: 'PG-13',
    director: 'Soren Lind',
    cast: ['Freja Møller', 'Jonas Brandt'],
    posterUrl: '/src/assets/images/poster_quantum_horizon_1792597454046.jpg',
    backdropUrl: '/src/assets/images/hero_movie_sci_fi_1792597453242.jpg',
    trailerUrl: 'https://www.youtube.com',
    featured: false,
    active: true,
  });

  // 5. Showtimes
  // Create showtimes for today, tomorrow, and day after tomorrow
  const now = new Date();
  const times = [
    { hour: 11, minute: 30 },
    { hour: 14, minute: 45 },
    { hour: 18, minute: 15 },
    { hour: 21, minute: 30 },
  ];

  const createdShowtimes: any[] = [];

  for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
    for (let t = 0; t < times.length; t++) {
      const { hour, minute } = times[t];
      const start1 = new Date(now);
      start1.setDate(now.getDate() + dayOffset);
      start1.setHours(hour, minute, 0, 0);

      const end1 = new Date(start1.getTime() + 148 * 60 * 1000);

      const st1 = await Showtime.create({
        movie: movie1._id,
        theatre: grandCineplex._id,
        screen: screen1._id,
        startTime: start1,
        endTime: end1,
        basePrice: 15.0,
        pricing: { standard: 15.0, premium: 19.5, vip: 26.0 },
        status: 'scheduled',
      });
      createdShowtimes.push(st1);

      // Starlight IMAX showtime for Movie 1 or 2
      const start2 = new Date(start1.getTime() + 30 * 60 * 1000); // offset by 30 mins
      const end2 = new Date(start2.getTime() + 132 * 60 * 1000);
      const targetMovie = t % 2 === 0 ? movie2 : movie4;

      const st2 = await Showtime.create({
        movie: targetMovie._id,
        theatre: starlightMultiplex._id,
        screen: screen2._id,
        startTime: start2,
        endTime: end2,
        basePrice: 18.0,
        pricing: { standard: 18.0, premium: 23.0, vip: 30.0 },
        status: 'scheduled',
      });
      createdShowtimes.push(st2);

      // Velvet Lounge showtime
      const start3 = new Date(start1.getTime() + 45 * 60 * 1000);
      const end3 = new Date(start3.getTime() + 156 * 60 * 1000);
      const st3 = await Showtime.create({
        movie: movie3._id,
        theatre: velvetLounge._id,
        screen: screen3._id,
        startTime: start3,
        endTime: end3,
        basePrice: 22.0,
        pricing: { standard: 22.0, premium: 28.0, vip: 38.0 },
        status: 'scheduled',
      });
      createdShowtimes.push(st3);
    }
  }

  // 6. Pre-book some realistic seats on the first couple showtimes
  if (createdShowtimes.length > 0) {
    const firstShow = createdShowtimes[0];
    await Booking.create({
      bookingReference: 'IM-7D9A2',
      user: demoCustomer._id,
      customerName: demoCustomer.name,
      customerEmail: demoCustomer.email,
      movie: firstShow.movie,
      theatre: firstShow.theatre,
      screen: firstShow.screen,
      showtime: firstShow._id,
      seats: [
        { seatId: 'D5', row: 'D', number: 5, category: 'premium', price: 19.5 },
        { seatId: 'D6', row: 'D', number: 6, category: 'premium', price: 19.5 },
      ],
      subtotal: 39.0,
      bookingFee: 2.0,
      tax: 1.5,
      totalAmount: 42.5,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentReference: 'PAY_SANDBOX_792182',
    });

    // Also mark C4, C5 as booked by another guest
    await Booking.create({
      bookingReference: 'IM-4X1B9',
      user: admin._id,
      customerName: 'VIP Studio Patron',
      customerEmail: 'patron@cinemaclub.org',
      movie: firstShow.movie,
      theatre: firstShow.theatre,
      screen: firstShow.screen,
      showtime: firstShow._id,
      seats: [
        { seatId: 'F4', row: 'F', number: 4, category: 'vip', price: 26.0 },
        { seatId: 'F5', row: 'F', number: 5, category: 'vip', price: 26.0 },
      ],
      subtotal: 52.0,
      bookingFee: 2.0,
      tax: 2.0,
      totalAmount: 56.0,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentReference: 'PAY_SANDBOX_819231',
    });
  }

  console.log(`Database seeded successfully!
    - Admin: admin@imovies.com (Password: AdminPass123!)
    - Customer: user@imovies.com (Password: UserPass123!)
    - ${await Movie.countDocuments()} Movies
    - ${await Theatre.countDocuments()} Theatres
    - ${await Screen.countDocuments()} Screens
    - ${await Showtime.countDocuments()} Showtimes
    - ${await Booking.countDocuments()} Bookings`);
}
