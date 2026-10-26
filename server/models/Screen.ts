import mongoose, { Schema, Document } from 'mongoose';

export interface ISeatDefinition {
  seatId: string; // e.g. "A1"
  row: string; // "A"
  number: number; // 1
  category: 'standard' | 'premium' | 'vip';
  priceMultiplier: number;
}

export interface IScreen extends Document {
  theatre: mongoose.Types.ObjectId;
  screenNumber: number;
  name: string;
  screenType: 'Standard' | 'IMAX 3D' | 'Dolby Cinema' | 'VIP Lounge';
  rows: string[]; // e.g. ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  seatsPerRow: number; // e.g. 10
  seats: ISeatDefinition[];
  totalSeats: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seatDefinitionSchema = new Schema<ISeatDefinition>(
  {
    seatId: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    category: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      default: 'standard',
    },
    priceMultiplier: {
      type: Number,
      default: 1.0,
    },
  },
  { _id: false }
);

const screenSchema = new Schema<IScreen>(
  {
    theatre: {
      type: Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
      index: true,
    },
    screenNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    screenType: {
      type: String,
      enum: ['Standard', 'IMAX 3D', 'Dolby Cinema', 'VIP Lounge'],
      default: 'Dolby Cinema',
    },
    rows: {
      type: [String],
      default: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    },
    seatsPerRow: {
      type: Number,
      default: 10,
    },
    seats: [seatDefinitionSchema],
    totalSeats: {
      type: Number,
      required: true,
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

// Prevent duplicate screen numbers within the same theatre
screenSchema.index({ theatre: 1, screenNumber: 1 }, { unique: true });

export const Screen = mongoose.model<IScreen>('Screen', screenSchema);
