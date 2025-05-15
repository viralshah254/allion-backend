import mongoose from "mongoose";

// Group Interface
export interface IGroup extends mongoose.Document {
  groupCode: string;
  groupName: string;
  members: {
    clientId: mongoose.Types.ObjectId;
    clientType: string;
  }[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Group Schema
const GroupSchema = new mongoose.Schema<IGroup>(
  {
    groupCode: {
      type: String,
      unique: true,
      required: true,
    },
    groupName: {
      type: String,
      required: [true, "Please provide a group name"],
      trim: true,
    },
    members: [
      {
        clientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Client",
          required: true,
        },
        clientType: {
          type: String,
          required: true,
          enum: ["individual", "corporate"],
        },
      },
    ],
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a unique group code before saving
GroupSchema.pre("save", async function (next) {
  // Only generate code if it's a new group
  if (this.isNew && !this.groupCode) {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    this.groupCode = `GRP-${randomCode}`;
  }
  next();
});

export default mongoose.model<IGroup>("Group", GroupSchema);
