import mongoose, { Schema, Document } from 'mongoose';

export interface IShowtime extends Document {
  movie: mongoose.Types.ObjectId;
  theatre: mongoose.Types.ObjectId;
  screen: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  basePrice: number; // e.g. 14.50
  pricing: {
    standard: number;
    premium: number;
    vip: number;
  };
  status: 'scheduled' | 'cancelled' | 'completed';
  cancellationCutoffMinutes: number; // e.g. 60 min before show
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const showtimeSchema = new Schema<IShowtime>(
  {
    movie: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    theatre: {
      type: Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
      index: true,
    },
    screen: {
      type: Schema.Types.ObjectId,
      ref: 'Screen',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    basePrice: {
      type: Number,
      required: true,
      default: 15.0,
      min: 0,
    },
    pricing: {
      standard: { type: Number, default: 15.0 },
      premium: { type: Number, default: 20.0 },
      vip: { type: Number, default: 28.0 },
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
    cancellationCutoffMinutes: {
      type: Number,
      default: 60,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast showtime queries
showtimeSchema.index({ movie: 1, startTime: 1 });
showtimeSchema.index({ theatre: 1, startTime: 1 });
showtimeSchema.index({ screen: 1, startTime: 1, endTime: 1 });

export const Showtime = mongoose.model<IShowtime>('Showtime', showtimeSchema);
