import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedEvent extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  savedAt: Date;
}

const SavedEventSchema = new Schema<ISavedEvent>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate saves
SavedEventSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model<ISavedEvent>('SavedEvent', SavedEventSchema);
