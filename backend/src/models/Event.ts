import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  ticketType: 'free' | 'paid';
  ticketPrice?: number;
  capacity: number;
  imageUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isApproved: boolean;
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  tags: string[];
  requirements?: string;
  contactInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['academic', 'social', 'sports', 'cultural', 'career', 'volunteer', 'other']
  },
  ticketType: {
    type: String,
    enum: ['free', 'paid'],
    required: true
  },
  ticketPrice: {
    type: Number,
    required: function() {
      return this.ticketType === 'paid';
    },
    min: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  requirements: {
    type: String,
    trim: true
  },
  contactInfo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
EventSchema.index({ date: 1, status: 1 });
EventSchema.index({ organization: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ isApproved: 1, status: 1 });

export default mongoose.model<IEvent>('Event', EventSchema);