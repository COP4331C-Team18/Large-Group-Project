import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  verified: boolean;
  verificationCode: string | null;
  verificationCodeExpires: Date | null;
  provider: "inkboard" | "google";
  avatarId: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // password is only required for regular inkboard authentication
    // not required for google auth
    password: {
      type: String,
      required: function (this: UserDocument) {
        return this.provider === "inkboard";
      },
      trim: true,
    },
    
    // for email verification
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: { 
      type: String, 
      default: null 
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
    },

    // to hopefully support google and regular account login
    provider: {
      type: String,
      enum: ["inkboard", "google"],
      default: "inkboard",
    },

    // avatar preset id
    avatarId: {
      type: String,
      default: "default",
    },
  },
  { timestamps: true }
);

// Hash password before saving for regular inkboard authentication
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  if (this.provider !== "inkboard") return; // Only hash for inkboard auth

  let saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS );
  if(!saltRounds) {
    saltRounds = 10; // default to 10 if not set
  }

  this.password = await bcrypt.hash(this.password, saltRounds);
});


// Compare password for login
userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<UserDocument>("User", userSchema);
