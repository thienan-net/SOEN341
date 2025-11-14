import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "student" | "organizer" | "admin";

  organizerStatus?: "pending" | "approved" | "rejected";
  organizerNotes?: string;

  studentId?: string;

  organization?: mongoose.Types.ObjectId;

  isApproved: boolean;

  profilePicture?: string;
  phoneNumber?: string;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      password: {
        type: String,
        required: true,
        minlength: 6,
      },

      firstName: { type: String, required: true },
      lastName: { type: String, required: true },

      role: {
        type: String,
        enum: ["student", "organizer", "admin"],
        required: true,
      },

      organizerStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },

      organizerNotes: String,

      // Student only
      studentId: {
        type: String,
        required: false, // <-- FINI les erreurs TS !!
      },

      organization: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: false, // <-- FINI les erreurs TS !!
      },

      isApproved: {
        type: Boolean,
        default: true,
      },

      profilePicture: String,
      phoneNumber: String,
    },
    { timestamps: true }
);

// Password hashing
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
