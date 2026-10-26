import mongoose, { Schema, Document } from 'mongoose';

export interface IMovie extends Document {
  title: string;
  description: string;
  genres: string[];
  language: string;
  duration: number; // in minutes
  releaseDate: Date;
  releaseStatus: 'now_showing' | 'upcoming';
  rating: number; // e.g. 8.8
  ageClassification: string; // e.g. 'PG-13', 'R'
  director: string;
  cast: string[];
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  featured?: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    genres: {
      type: [String],
      required: true,
      default: ['Action'],
      index: true,
    },
    language: {
      type: String,
      required: true,
      default: 'English',
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    releaseDate: {
      type: Date,
      required: true,
      index: true,
    },
    releaseStatus: {
      type: String,
      enum: ['now_showing', 'upcoming'],
      default: 'now_showing',
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.5,
    },
    ageClassification: {
      type: String,
      default: 'PG-13',
    },
    director: {
      type: String,
      default: 'Unknown Director',
    },
    cast: {
      type: [String],
      default: [],
    },
    posterUrl: {
      type: String,
      required: true,
    },
    backdropUrl: {
      type: String,
      required: true,
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
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

// Text search index with custom language_override to avoid collisions with the 'language' field
movieSchema.index(
  { title: 'text', description: 'text', genres: 'text', director: 'text' },
  { language_override: 'searchLanguage', default_language: 'none' }
);

export const Movie = mongoose.model<IMovie>('Movie', movieSchema);
