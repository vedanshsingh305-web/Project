import mongoose, { Schema, Document } from 'mongoose';

export interface ISeatReservation extends Document {
  showtime: mongoose.Types.ObjectId;
  seatId: string; // e.g. "C5"
  userId: mongoose.Types.ObjectId;
  sessionId: string; // fallback session identifier
  expiresAt: Date;
  status: 'held' | 'confirmed' | 'released';
  createdAt: Date;
  updatedAt: Date;
}

const seatReservationSchema = new Schema<ISeatReservation>(
  {
    showtime: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
      index: true,
    },
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['held', 'confirmed', 'released'],
      default: 'held',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for seat within showtime
seatReservationSchema.index({ showtime: 1, seatId: 1, status: 1 });

// TTL index to automatically prune expired reservations after 15 minutes
seatReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 900 });

export const SeatReservation = mongoose.model<ISeatReservation>('SeatReservation', seatReservationSchema);
