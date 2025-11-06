import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedEvent extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  createdAt: Date;
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
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Ensure unique combination of user and event
SavedEventSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model<ISavedEvent>('SavedEvent', SavedEventSchema);
