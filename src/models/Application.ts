import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  clientName: string;
  clientEmail: string;
  coverageType: string;
  premiumAmount: number;
  status: "pending" | "approved" | "rejected";
  applicationDate: Date;
}

const ApplicationSchema: Schema = new Schema({
  clientName: {
    type: String,
    required: [true, "Client name is required"],
    trim: true,
  },
  clientEmail: {
    type: String,
    required: [true, "Client email is required"],
    trim: true,
    lowercase: true,
    // A simple regex for email validation, consider a more robust one for production
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },
  coverageType: {
    type: String,
    required: [true, "Coverage type is required"],
    enum: ["health", "life", "auto", "home"], // Example coverage types
  },
  premiumAmount: {
    type: Number,
    required: [true, "Premium amount is required"],
    min: [0, "Premium amount cannot be negative"],
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IApplication>("Application", ApplicationSchema);
