import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  qrCode: string;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  usedAt?: Date;
  usedBy?: mongoose.Types.ObjectId;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true // ✅ unique already creates an index — no need for .index()
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    qrCode: {
      type: String,
      required: true,
      unique: true // ✅ same here
    },
    status: {
      type: String,
      enum: ['active', 'used', 'cancelled', 'expired'],
      default: 'active'
    },
    usedAt: {
      type: Date
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    price: {
      type: Number,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// ✅ Keep only necessary additional indexes
TicketSchema.index({ event: 1, user: 1 }); // compound index still valid
TicketSchema.index({ status: 1 });         // useful for filtering

export default mongoose.model<ITicket>('Ticket', TicketSchema);
