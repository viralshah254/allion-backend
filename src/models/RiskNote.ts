import mongoose from "mongoose";

// Motor Subcategory Enum
export enum MotorSubcategory {
  Private = "Private",
  CommercialOwnGoods = "CommercialOwnGoods",
  CommercialGeneralCartage = "CommercialGeneralCartage",
  CommercialInstitutionalVehicle = "CommercialInstitutionalVehicle",
  CommercialSpecialVehicle = "CommercialSpecialVehicle",
  CommercialSpecialVehicleThirdPartyOnly = "CommercialSpecialVehicleThirdPartyOnly",
  CommercialThreeWheeler = "CommercialThreeWheeler",
  Cycle = "Cycle",
  CycleThirdPartyOnly = "CycleThirdPartyOnly",
}

// Define interfaces for premium breakdown
interface ICoverExtras {
  recovery: number;
  windscreen: number;
  entertainment: number;
  repair: number;
  thirdPartyProperty: number;
  thirdPartyPassenger: number;
  thirdPartyOthers: number;
}

interface ICoverExtraRates {
  recovery: number;
  windscreen: number;
  entertainment: number;
  repair: number;
  thirdPartyProperty: number;
  thirdPartyPassenger: number;
  thirdPartyOthers: number;
}

interface IOptionalExtLimits {
  noBlameNoExcess: number;
  windscreenMirror: number;
  emergencyMedicalSectionIII: number;
  excessTheft: number;
  returnToInvoice: number;
  driveThrough: number;
  carHire: number;
  personalEffects: number;
  forcedATM: number;
  personalAccident: number;
}

interface IOptionalExtRates {
  noBlameNoExcess: number;
  windscreenMirror: number;
  emergencyMedicalSectionIII: number;
  excessTheft: number;
  returnToInvoice: number;
  driveThrough: number;
  carHire: number;
  personalEffects: number;
  forcedATM: number;
  personalAccident: number;
}

interface IIncludeOptionalExt {
  noBlameNoExcess: boolean;
  windscreenMirror: boolean;
  emergencyMedicalSectionIII: boolean;
  excessTheft: boolean;
  returnToInvoice: boolean;
  driveThrough: boolean;
  carHire: boolean;
  personalEffects: boolean;
  forcedATM: boolean;
  personalAccident: boolean;
}

// Premium breakdown interface
interface IPremiumBreakdown {
  policyCategory: string;
  selectedPolicy: string;
  sumInsured: number;
  rate: number;
  basePremium: number;
  terrorism: boolean;
  terrorismRate: number;
  terrorismPremium: number;
  excessProtector: boolean;
  excessProtectorRate: number;
  excessProtectorPremium: number;
  coverExtras: ICoverExtras;
  coverExtraRates: ICoverExtraRates;
  coverExtraPremium: number;
  optionalExtLimits: IOptionalExtLimits;
  optionalExtRates: IOptionalExtRates;
  includeOptionalExt: IIncludeOptionalExt;
  optionalExtPremium: number;
  trainingLevy: number;
  pcfLevy: number;
  stampDuty: number;
  totalPremium: number;
}

// Motor specific fields
interface IMotorDetails {
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
}

// Risk Note Interface
export interface IRiskNote extends mongoose.Document {
  policyNumber: string;
  client: mongoose.Types.ObjectId;
  insuranceCompany: mongoose.Types.ObjectId;
  policyCategory: string;
  subCategory?: string;
  motorDetails?: IMotorDetails;
  premiumBreakdown: IPremiumBreakdown;
  riskNoteDocUrl?: string;
  
  // Dates
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Risk Note Schema
const RiskNoteSchema = new mongoose.Schema<IRiskNote>(
  {
    policyNumber: {
      type: String,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    insuranceCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InsuranceCompany",
      required: [true, "Insurance company is required"],
    },
    policyCategory: {
      type: String,
      required: [true, "Policy category is required"],
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    motorDetails: {
      registrationNumber: String,
      make: String,
      model: String,
      year: String,
    },
    premiumBreakdown: {
      policyCategory: {
        type: String,
        required: [true, "Policy category in premium breakdown is required"],
      },
      selectedPolicy: {
        type: String,
        required: [true, "Selected policy is required"],
      },
      sumInsured: {
        type: Number,
        required: [true, "Sum insured is required"],
      },
      rate: {
        type: Number,
        required: [true, "Rate is required"],
      },
      basePremium: {
        type: Number,
        required: [true, "Base premium is required"],
      },
      terrorism: {
        type: Boolean,
        default: false,
      },
      terrorismRate: {
        type: Number,
        default: 0,
      },
      terrorismPremium: {
        type: Number,
        default: 0,
      },
      excessProtector: {
        type: Boolean,
        default: false,
      },
      excessProtectorRate: {
        type: Number,
        default: 0,
      },
      excessProtectorPremium: {
        type: Number,
        default: 0,
      },
      coverExtras: {
        recovery: { type: Number, default: 0 },
        windscreen: { type: Number, default: 0 },
        entertainment: { type: Number, default: 0 },
        repair: { type: Number, default: 0 },
        thirdPartyProperty: { type: Number, default: 0 },
        thirdPartyPassenger: { type: Number, default: 0 },
        thirdPartyOthers: { type: Number, default: 0 },
      },
      coverExtraRates: {
        recovery: { type: Number, default: 0 },
        windscreen: { type: Number, default: 0 },
        entertainment: { type: Number, default: 0 },
        repair: { type: Number, default: 0 },
        thirdPartyProperty: { type: Number, default: 0 },
        thirdPartyPassenger: { type: Number, default: 0 },
        thirdPartyOthers: { type: Number, default: 0 },
      },
      coverExtraPremium: {
        type: Number,
        default: 0,
      },
      optionalExtLimits: {
        noBlameNoExcess: { type: Number, default: 0 },
        windscreenMirror: { type: Number, default: 0 },
        emergencyMedicalSectionIII: { type: Number, default: 0 },
        excessTheft: { type: Number, default: 0 },
        returnToInvoice: { type: Number, default: 0 },
        driveThrough: { type: Number, default: 0 },
        carHire: { type: Number, default: 0 },
        personalEffects: { type: Number, default: 0 },
        forcedATM: { type: Number, default: 0 },
        personalAccident: { type: Number, default: 0 },
      },
      optionalExtRates: {
        noBlameNoExcess: { type: Number, default: 0 },
        windscreenMirror: { type: Number, default: 0 },
        emergencyMedicalSectionIII: { type: Number, default: 0 },
        excessTheft: { type: Number, default: 0 },
        returnToInvoice: { type: Number, default: 0 },
        driveThrough: { type: Number, default: 0 },
        carHire: { type: Number, default: 0 },
        personalEffects: { type: Number, default: 0 },
        forcedATM: { type: Number, default: 0 },
        personalAccident: { type: Number, default: 0 },
      },
      includeOptionalExt: {
        noBlameNoExcess: { type: Boolean, default: false },
        windscreenMirror: { type: Boolean, default: false },
        emergencyMedicalSectionIII: { type: Boolean, default: false },
        excessTheft: { type: Boolean, default: false },
        returnToInvoice: { type: Boolean, default: false },
        driveThrough: { type: Boolean, default: false },
        carHire: { type: Boolean, default: false },
        personalEffects: { type: Boolean, default: false },
        forcedATM: { type: Boolean, default: false },
        personalAccident: { type: Boolean, default: false },
      },
      optionalExtPremium: {
        type: Number,
        default: 0,
      },
      trainingLevy: {
        type: Number,
        default: 0,
      },
      pcfLevy: {
        type: Number,
        default: 0,
      },
      stampDuty: {
        type: Number,
        default: 0,
      },
      totalPremium: {
        type: Number,
        required: [true, "Total premium is required"],
      },
    },
    riskNoteDocUrl: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
     
    },
    endDate: {
      type: Date,
     
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to validate motor details
RiskNoteSchema.pre("validate", function (next) {
  // If policy category is Motor, ensure subCategory is present and valid
  if (this.policyCategory === "Motor") {
    if (!this.subCategory) {
      this.invalidate(
        "subCategory",
        "Subcategory is required for Motor policy"
      );
    } else if (
      !Object.values(MotorSubcategory).includes(
        this.subCategory as MotorSubcategory
      )
    ) {
      this.invalidate("subCategory", "Invalid subcategory for Motor policy");
    }

    // Ensure motor details are present
    if (
      !this.motorDetails ||
      !this.motorDetails.registrationNumber ||
      !this.motorDetails.make ||
      !this.motorDetails.model ||
      !this.motorDetails.year
    ) {
      this.invalidate(
        "motorDetails",
        "Complete motor details are required for Motor policy"
      );
    }
  }

  next();
});
RiskNoteSchema.pre("save", function (next) {
  if (!this.policyNumber) {
    //create a policy number that is unique and has a prefix of "PN"
    this.policyNumber = "PN" + Math.random().toString(36).substring(2, 15);
  }
  next();
});

export default mongoose.model<IRiskNote>("RiskNote", RiskNoteSchema);
