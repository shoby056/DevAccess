const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      minlength: 5,
      maxlength: 500,
    },

    requestedRole: {
      type: String,
      enum: ["READ", "WRITE", "ADMIN"],
      default: "READ",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewComment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

accessRequestSchema.index({ requester: 1 });
accessRequestSchema.index({ resource: 1 });
accessRequestSchema.index({ project: 1 });
accessRequestSchema.index({ status: 1 });
accessRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "AccessRequest",
  accessRequestSchema
);