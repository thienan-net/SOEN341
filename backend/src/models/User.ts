import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'organizer' | 'admin';
  organizerStatus?: 'pending' | 'approved' | 'rejected';
  organizerNotes?: string;
  studentId?: string;
  organization?: mongoose.Types.ObjectId;
  isApproved: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'organizer', 'admin'],
    required: true
  },
  organizerStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  organizerNotes: {
    type: String,
    maxlength: 2000
  },
  studentId: {
    type: String,
    required: function(this: IUser) {
      return this.role === 'student';
    }
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: function(this: IUser) {
      return this.role === 'organizer';
    }
  },
  isApproved: {
    type: Boolean,
    default: function(this: IUser) {
      // Only students and admins use isApproved
      // Organizers use organizerStatus instead
      return this.role === 'student' || this.role === 'admin';
    }
  },
  profilePicture: {
    type: String
  },
  phoneNumber: {
    type: String
  }
}, {
  timestamps: true
});

// useful index
UserSchema.index({ role: 1, organizerStatus: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);