import mongoose from "mongoose";

// Client Type Enum
export enum ClientType {
  INDIVIDUAL = "individual",
  CORPORATE = "corporate",
  GROUP = "group",
}

// Department Enum
export enum Department {
  SALES = "sales",
  FINANCE = "finance",
  OPERATIONS = "operations",
  MARKETING = "marketing",
  HUMAN_RESOURCES = "human_resources",
  CUSTOMER_SERVICE = "customer_service",
  LEGAL = "legal",
  IT = "it",
  OTHER = "other",
}

// Contact Person Interface
interface IContactPerson {
  name: string;
  phoneNumber: string;
  email: string;
  department?: Department;
  isMainContact?: boolean;
}

// Client Interface
export interface IClient extends mongoose.Document {
  clientCode: string;
  clientType: ClientType;
  // Individual specific fields
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  occupation?: string;

  // Corporate specific fields
  companyName?: string;

  // Common fields
  postalAddress?: string;
  physicalAddress?: string;
  coordinates?: string;
  phoneNumber?: string;
  email?: string;
  contactPersons?: IContactPerson[];
  referredBy?: string;
  kycDocuments?: string[];
  isGroup?: boolean;
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
    match: [/^\+?[0-9]{10,15}$/, "Please add a valid phone number"],
  },
  email: {
    type: String,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please add a valid email"],
  },
  department: {
    type: String,
    enum: Object.values(Department),
    default: Department.OTHER,
  },
  isMainContact: {
    type: Boolean,
    default: false,
  },
});

// Client Schema
const ClientSchema = new mongoose.Schema<IClient>(
  {
    clientCode: {
      type: String,
      unique: true,
      required: true,
    },
    clientType: {
      type: String,
      enum: Object.values(ClientType),
      required: [true, "Please specify client type"],
    },
    // Individual specific fields
    firstName: {
      type: String,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    occupation: {
      type: String,
      trim: true,
    },

    // Corporate specific fields
    companyName: {
      type: String,
      trim: true,
    },

    // Common fields
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
      match: [/^\+?[0-9]{10,15}$/, "Please add a valid phone number"],
    },
    email: {
      type: String,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please add a valid email"],
    },
    contactPersons: [ContactPersonSchema],
    referredBy: {
      type: String,
      trim: true,
    },
    kycDocuments: [
      {
        type: String,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a unique client code before saving
ClientSchema.pre("save", async function (next) {
  // Only generate code if it's a new client
  if (this.isNew && !this.clientCode) {
    // Format: CLT-[TYPE FIRST LETTER]-[RANDOM 6 DIGITS]
    const typeCode = this.clientType.charAt(0).toUpperCase();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    this.clientCode = `CLT-${typeCode}-${randomCode}`;
  }
  next();
});

export default mongoose.model<IClient>("Client", ClientSchema);
