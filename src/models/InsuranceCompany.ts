import mongoose from "mongoose";

// KYC Status Enum
export enum KycStatus {
  COMPLETE = "Complete",
  INCOMPLETE = "Incomplete",
  PENDING = "Pending",
  REJECTED = "Rejected",
}

// Department Enum
// export enum Department {
//   SALES = "Sales",
//   FINANCE = "Finance",
//   OPERATIONS = "Operations",
//   MARKETING = "Marketing",
//   HUMAN_RESOURCES = "Human Resources",
//   CUSTOMER_SERVICE = "Customer Service",
//   LEGAL = "Legal",
//   IT = "IT",
//   OTHER = "Other",
// }

// Contact Person Interface
interface IContactPerson {
  name: string;
  phoneNumber: string;
  email: string;
  department?:string;
  isMainContact?: boolean;
}

// Branch Interface
interface IBranch {
  name: string;
  address: string;
}

// Insurance Company Interface
export interface IInsuranceCompany extends mongoose.Document {
  code: string;
  companyName: string;
  postalAddress?: string;
  physicalAddress?: string;
  coordinates?: string;
  phoneNumber?: string;
  email?: string;
  contactPersons?: IContactPerson[];
  branches?: IBranch[];
  kycDocuments?: {
    license?: string;
    registration?: string;
    taxClearance?: string;
  };
  kycStatus?: KycStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Contact Person Schema
const ContactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide contact person name"],
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, "Please provide contact person phone number"],
    match: [
      /^\+[0-9]{10,14}$/,
      "Please add a valid phone number with country code",
    ],
  },
  email: {
    type: String,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please add a valid email"],
  },
  department: {
    type: String,
    // enum: Object.values(Department),
    // default: Department.OTHER,
  },
  isMainContact: {
    type: Boolean,
    default: false,
  },
});

// Branch Schema
const BranchSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
 
    trim: true,
  },
});

// Insurance Company Schema
const InsuranceCompanySchema = new mongoose.Schema<IInsuranceCompany>(
  {
    code: {
      type: String,
      unique: true,
      required: false,
    },
    companyName: {
      type: String,
      required: [true, "Please provide company name"],
      trim: true,
      unique: true,
    },
    postalAddress: {
      type: String,
      trim: true,
    },
    physicalAddress: {
      type: String,
      trim: true,
    },
    coordinates: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      match: [
        /^\+[0-9]{10,14}$/,
        "Please add a valid phone number with country code",
      ],
      index: { unique: true, sparse: true },
    },
    email: {
      type: String,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please add a valid email"],
      index: { unique: true, sparse: true },
    },
    contactPersons: [ContactPersonSchema],
    branches: [BranchSchema],
    kycDocuments: {
      license: {
        type: String,
      },
      registration: {
        type: String,
      },
      taxClearance: {
        type: String,
      },
    },
    kycStatus: {
      type: String,
      enum: Object.values(KycStatus),
      default: KycStatus.INCOMPLETE,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a unique company code before saving
InsuranceCompanySchema.pre("save", async function (next) {
  // Only generate code if it's a new company
  if (this.isNew && !this.code) {
    // Format: INS-[First 3 letters of company name]-[RANDOM 4 DIGITS]
    const namePrefix = this.companyName
      .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
      .substring(0, 3)
      .toUpperCase();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    this.code = `INS-${namePrefix}-${randomCode}`;
  }
  next();
});

export default mongoose.model<IInsuranceCompany>(
  "InsuranceCompany",
  InsuranceCompanySchema
);
