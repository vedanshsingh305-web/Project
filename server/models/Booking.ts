import mongoose, { Schema, Document } from 'mongoose';

export interface IBookedSeat {
  seatId: string;
  row: string;
  number: number;
  category: 'standard' | 'premium' | 'vip';
  price: number;
}

export interface IBooking extends Document {
  bookingReference: string; // e.g. "IM-9B41E"
  user: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  movie: mongoose.Types.ObjectId;
  theatre: mongoose.Types.ObjectId;
  screen: mongoose.Types.ObjectId;
  showtime: mongoose.Types.ObjectId;
  seats: IBookedSeat[];
  subtotal: number;
  bookingFee: number;
  tax: number;
  totalAmount: number;
  bookingStatus: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  paymentReference?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookedSeatSchema = new Schema<IBookedSeat>(
  {
    seatId: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: '',
    },
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
    showtime: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
      index: true,
    },
    seats: [bookedSeatSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    bookingFee: {
      type: Number,
      default: 2.0,
    },
    tax: {
      type: Number,
      default: 1.5,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'PENDING'],
      default: 'CONFIRMED',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'REFUNDED'],
      default: 'PAID',
    },
    paymentMethod: {
      type: String,
      default: 'CARD',
    },
    paymentReference: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ showtime: 1, bookingStatus: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
