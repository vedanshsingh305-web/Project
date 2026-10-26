import mongoose, { Schema, Document } from 'mongoose';

export interface ITheatre extends Document {
  name: string;
  address: string;
  city: string;
  contactPhone?: string;
  active: boolean;
  facilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const theatreSchema = new Schema<ITheatre>(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      index: true,
    },
    contactPhone: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    facilities: {
      type: [String],
      default: ['Dolby Atmos', '4K Laser Projection', 'Recliner Seating', 'Gourmet Concessions'],
    },
  },
  {
    timestamps: true,
  }
);

export const Theatre = mongoose.model<ITheatre>('Theatre', theatreSchema);
