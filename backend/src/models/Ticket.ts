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

    returnReason?: string;
    returnComment?: string;
    returnedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

// @ts-ignore
const TicketSchema = new Schema<ITicket>(
    {
        ticketId: {
            type: String,
            required: true,
            unique: true
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
            unique: true
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
        },


        returnReason: {
            type: String,
            default: null
        },
        returnComment: {
            type: String,
            default: null
        },
        returnedAt: {
            type: Date,
            default: null
        }
    },

    {
        timestamps: true
    }
);

// Indexes
TicketSchema.index({ event: 1, user: 1 });
TicketSchema.index({ status: 1 });

export default mongoose.model<ITicket>('Ticket', TicketSchema);
