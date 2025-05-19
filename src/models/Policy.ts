import mongoose from "mongoose";

// Policy Type Enum
export enum PolicyType {
  HOME = "Home",
  LIFE = "Life",
  BUSINESS = "Business",
  AUTO = "Auto",
}

// Policy Status Enum
export enum PolicyStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  PENDING = "Pending",
  EXPIRED = "Expired",
  CANCELLED = "Cancelled",
}

// Payment Frequency Enum
export enum PaymentFrequency {
  MONTHLY = "Monthly",
  QUARTERLY = "Quarterly",
  SEMI_ANNUALLY = "Semi-Annually",
  ANNUALLY = "Annually",
  ONE_TIME = "One-Time",
}

// Policy Interface
export interface IPolicy extends mongoose.Document {
  policyNumber: string;
  policyType: PolicyType;

  // References to either client or group
  client?: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;

  // Insurance details
  insuredItem: string;
  description?: string;
  coverageAmount: number;
  premium: number;
  deductible?: number;
  paymentFrequency: PaymentFrequency;

  // Dates
  startDate: Date;
  endDate: Date;

  // Status
  status: PolicyStatus;

  // Claims and documents
  claims?: Array<any>;
  documents?: Array<string>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Policy Schema
const PolicySchema = new mongoose.Schema<IPolicy>(
  {
    policyNumber: {
      type: String,
      unique: true,
      required: false,
    },
    policyType: {
      type: String,
      enum: Object.values(PolicyType),
      required: [true, "Please specify policy type"],
    },

    // References to either client or group
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },

    // Insurance details
    insuredItem: {
      type: String,
      required: [true, "Please specify what is being insured"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverageAmount: {
      type: Number,
      required: [true, "Please specify the coverage amount"],
    },
    premium: {
      type: Number,
      required: [true, "Please specify the premium amount"],
    },
    deductible: {
      type: Number,
    },
    paymentFrequency: {
      type: String,
      enum: Object.values(PaymentFrequency),
      default: PaymentFrequency.MONTHLY,
    },

    // Dates
    startDate: {
      type: Date,
      required: [true, "Please specify when the policy starts"],
    },
    endDate: {
      type: Date,
      required: [true, "Please specify when the policy ends"],
    },

    // Status
    status: {
      type: String,
      enum: Object.values(PolicyStatus),
      default: PolicyStatus.PENDING,
    },

    // Claims and documents
    claims: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    documents: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Custom validator to ensure either client or group is provided
PolicySchema.pre("validate", function (next) {
  if (!this.client && !this.group) {
    this.invalidate("client", "Either client or group must be specified");
  }
  next();
});

// Generate a unique policy number before saving
PolicySchema.pre("save", async function (next) {
  // Only generate code if it's a new policy
  if (this.isNew && !this.policyNumber) {
    // Format: POL-[TYPE FIRST LETTER]-[RANDOM 6 DIGITS]
    const typeCode = this.policyType.charAt(0).toUpperCase();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    this.policyNumber = `POL-${typeCode}-${randomCode}`;
  }
  next();
});

export default mongoose.model<IPolicy>("Policy", PolicySchema);
