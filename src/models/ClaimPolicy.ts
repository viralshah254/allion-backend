import mongoose from "mongoose";

// Define interfaces for nested schemas
interface IVehicleInvolved {
  registrationNumber: string;
  makeType: string;
  ownerName: string;
  ownerAddress: string;
  insurer: string;
  policyNumber: string;
}

interface IInjuredPerson {
  name: string;
  address: string;
  natureOfInjury: string;
  inOutPatient: string;
}

interface IWindscreenClaim {
  date: string;
  driverName: string;
  licenseNo: string;
  incidentDesc: string;
  repairer: string;
  replacementCost: string;
}

interface IAccidentClaim {
  date: string;
  time: string;
  place: string;
  roadSurface: "Wet" | "Dry";
  visibility: string;
  speedOfInsuredVehicle: string;
  speedOfOtherVehicle: string;
  warningGivenByYou: string;
  warningGivenByOtherParty: string;
  reportedToPolice: boolean;
  policeStation: string;
  policeOfficerDetails: string;
  alcoholDrugTest: string;
  policeStateWhoToBlame: string;
  sketchPlan: string;
  driverStatement: string;
  ownerStatement: string;
}

interface IDriverDetails {
  fullName: string;
  address: string;
  occupation: string;
  dateOfBirth: string;
  relationshipToInsured: string;
  drivingExperience: string;
  licenseType: "Full" | "Provisional";
  licenseObtainedDate: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  offenseHistory: string;
  previousAccidents: boolean;
  previousAccidentDetails?: string;
  drivingWithConsent: boolean;
  blamedForAccident: boolean;
  admittedLiability: boolean;
  physicalDefect: string;
  underInfluence: boolean;
  licenseSuspended: boolean;
  suspensionDetails?: string;
}

interface ICommercialVehicleDetails {
  typeOfGoods: string;
  ownerOfGoods: string;
  trailerAttached: boolean;
  trailerRegistration?: string;
  usedWithOwnerConsent: boolean;
  carryingPassengersForHire: boolean;
  numberOfPassengers: number;
  purposeIfNotCarriage: string;
}

interface IDamageDetails {
  natureOfDamage: string;
  inspectionLocation: string;
  inspectionDateTime: string;
}

// Main ClaimPolicy interface
export interface IClaimPolicy extends mongoose.Document {
  claimNumber: string;
  createdAt: Date;
  updatedAt: Date;
  status: "Draft" | "Submitted" | "Processing" | "Approved" | "Rejected";

  // Related policy information
  policyId: mongoose.Types.ObjectId;

  // Type of claim
  claimType: "Windscreen" | "Accident" | "Other";




  // Policy details
  policy: {
    policyNumber: string;
    periodFrom: string;
    periodTo: string;
    financier?: string;
    coverType: "Comprehensive" | "TPO" | "TPF&T";
  };

  // Vehicle details
  vehicle: {
    registrationNumber: string;
    makeModel: string;
    yearOfManufacture: string;
    carryingCapacity?: string;
    trailerRegistrationNumber?: string;
    trailerCapacity?: string;
    usePurpose: string;
    onHire: boolean;
  };

  // Commercial vehicle specifics (if applicable)
  commercialVehicle?: ICommercialVehicleDetails;

  // Driver details
  driver: IDriverDetails;

  // Accident details (if applicable)
  accidentDetails?: IAccidentClaim;

  // Windscreen details (if applicable)
  windscreenDetails?: IWindscreenClaim;

  // Damage information
  damageDetails: IDamageDetails;

  // Other involved parties
  otherVehiclesInvolved: IVehicleInvolved[];
  personsInjured: IInjuredPerson[];

  // Documentation
  documents?: {
    policeAbstractUrl?: string;
    driverLicenseUrl?: string;
    vehicleLogbookUrl?: string;
    psvLicenseUrl?: string;
    otherDocuments?: string[];
  };

  // Declarations
  declarationAccepted: boolean;
  declarationDate?: string;
  driverSignatureUrl?: string;
  policyHolderSignatureUrl?: string;
}

// Create the ClaimPolicy schema
const ClaimPolicySchema = new mongoose.Schema<IClaimPolicy>(
  {
    claimNumber: {
      type: String,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Processing", "Approved", "Rejected"],
      default: "Draft",
    },
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RiskNote",
      required: [true, "Risk note reference is required"],
    },
    claimType: {
      type: String,
      enum: ["Windscreen", "Accident", "Other"],
   
    },

    policy: {
      policyNumber: {
        type: String,
       
        trim: true,
      },
      periodFrom: {
        type: String,
       
      },
      periodTo: {
        type: String,
       
      },
      financier: {
        type: String,
        trim: true,
      },
      coverType: {
        type: String,
        enum: ["Comprehensive", "TPO", "TPF&T"],
       
      },
    },
    vehicle: {
      registrationNumber: {
        type: String,
        
        trim: true,
      },
      makeModel: {
        type: String,
    
        trim: true,
      },
      yearOfManufacture: {
        type: String,
     
        trim: true,
      },
      carryingCapacity: {
        type: String,
        trim: true,
      },
      trailerRegistrationNumber: {
        type: String,
        trim: true,
      },
      trailerCapacity: {
        type: String,
        trim: true,
      },
      usePurpose: {
        type: String,
    
        trim: true,
      },
      onHire: {
        type: Boolean,
        default: false,
      },
    },
    commercialVehicle: {
      typeOfGoods: {
        type: String,
        trim: true,
      },
      ownerOfGoods: {
        type: String,
        trim: true,
      },
      trailerAttached: {
        type: Boolean,
        default: false,
      },
      trailerRegistration: {
        type: String,
        trim: true,
      },
      usedWithOwnerConsent: {
        type: Boolean,
        default: true,
      },
      carryingPassengersForHire: {
        type: Boolean,
        default: false,
      },
      numberOfPassengers: {
        type: Number,
        default: 0,
      },
      purposeIfNotCarriage: {
        type: String,
        trim: true,
      },
    },
    driver: {
      fullName: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      occupation: {
        type: String,
        trim: true,
      },
      dateOfBirth: {
        type: String,
      },
      relationshipToInsured: {
        type: String,
        
        trim: true,
      },
      drivingExperience: {
        type: String,
        
        trim: true,
      },
      licenseType: {
        type: String,
        enum: ["Full", "Provisional"],
        
      },
      licenseObtainedDate: {
        type: String,
        
      },
      licenseNumber: {
        type: String,
        
        trim: true,
      },
      licenseExpiryDate: {
        type: String,
        
      },
      offenseHistory: {
        type: String,
        trim: true,
      },
      previousAccidents: {
        type: Boolean,
        default: false,
      },
      previousAccidentDetails: {
        type: String,
        trim: true,
      },
      drivingWithConsent: {
        type: Boolean,
        default: true,
      },
      blamedForAccident: {
        type: Boolean,
        default: false,
      },
      admittedLiability: {
        type: Boolean,
        default: false,
      },
      physicalDefect: {
        type: String,
        trim: true,
      },
      underInfluence: {
        type: Boolean,
        default: false,
      },
      licenseSuspended: {
        type: Boolean,
        default: false,
      },
      suspensionDetails: {
        type: String,
        trim: true,
      },
    },
    accidentDetails: {
      date: {
        type: String,
        trim: true,
      },
      time: {
        type: String,
        trim: true,
      },
      place: {
        type: String,
        trim: true,
      },
      roadSurface: {
        type: String,
        enum: ["Wet", "Dry"],
      },
      visibility: {
        type: String,
        trim: true,
      },
      speedOfInsuredVehicle: {
        type: String,
        trim: true,
      },
      speedOfOtherVehicle: {
        type: String,
        trim: true,
      },
      warningGivenByYou: {
        type: String,
        trim: true,
      },
      warningGivenByOtherParty: {
        type: String,
        trim: true,
      },
      reportedToPolice: {
        type: Boolean,
        default: false,
      },
      policeStation: {
        type: String,
        trim: true,
      },
      policeOfficerDetails: {
        type: String,
        trim: true,
      },
      alcoholDrugTest: {
        type: String,
        trim: true,
      },
      policeStateWhoToBlame: {
        type: String,
        trim: true,
      },
      sketchPlan: {
        type: String,
        trim: true,
      },
      driverStatement: {
        type: String,
        trim: true,
      },
      ownerStatement: {
        type: String,
        trim: true,
      },
    },
    windscreenDetails: {
      date: {
        type: String,
        trim: true,
      },
      driverName: {
        type: String,
        trim: true,
      },
      licenseNo: {
        type: String,
        trim: true,
      },
      incidentDesc: {
        type: String,
        trim: true,
      },
      repairer: {
        type: String,
        trim: true,
      },
      replacementCost: {
        type: String,
        trim: true,
      },
    },
    damageDetails: {
      natureOfDamage: {
        type: String,
        
        trim: true,
      },
      inspectionLocation: {
        type: String,
        
        trim: true,
      },
      inspectionDateTime: {
        type: String,
        
      },
    },
    otherVehiclesInvolved: [
      {
        registrationNumber: {
          type: String,
          trim: true,
        },
        makeType: {
          type: String,
          trim: true,
        },
        ownerName: {
          type: String,
          trim: true,
        },
        ownerAddress: {
          type: String,
          trim: true,
        },
        insurer: {
          type: String,
          trim: true,
        },
        policyNumber: {
          type: String,
          trim: true,
        },
      },
    ],
    personsInjured: [
      {
        name: {
          type: String,
          trim: true,
        },
        address: {
          type: String,
          trim: true,
        },
        natureOfInjury: {
          type: String,
          trim: true,
        },
        inOutPatient: {
          type: String,
          trim: true,
        },
      },
    ],
    documents: {
      policeAbstractUrl: {
        type: String,
        trim: true,
      },
      driverLicenseUrl: {
        type: String,
        trim: true,
      },
      vehicleLogbookUrl: {
        type: String,
        trim: true,
      },
      psvLicenseUrl: {
        type: String,
        trim: true,
      },
      otherDocuments: [String],
    },
    declarationAccepted: {
      type: Boolean,
      default: false,
    },
    declarationDate: {
      type: String,
      trim: true,
    },
    driverSignatureUrl: {
      type: String,
      trim: true,
    },
    policyHolderSignatureUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a unique claim number before saving
ClaimPolicySchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  // Generate a unique claim number: CL + year + month + 5-digit sequence
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  // Find the highest existing claim number for this month/year pattern
  const prefix = `CL${year}${month}`;

  try {
    const ClaimModel = this.constructor as mongoose.Model<IClaimPolicy>;
    const lastClaim = await ClaimModel.findOne(
      { claimNumber: new RegExp(`^${prefix}`) },
      { claimNumber: 1 },
      { sort: { claimNumber: -1 } }
    );

    let sequence = 1;
    if (lastClaim && lastClaim.claimNumber) {
      // Extract the sequence part and increment
      const lastSequence = parseInt(lastClaim.claimNumber.slice(-5), 10);
      sequence = lastSequence + 1;
    }

    // Assign the new claim number
    this.claimNumber = `${prefix}${sequence.toString().padStart(5, "0")}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Create and export the model
const ClaimPolicy = mongoose.model<IClaimPolicy>(
  "ClaimPolicy",
  ClaimPolicySchema
);
export default ClaimPolicy;
