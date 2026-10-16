const mongoose = require("mongoose");

const accessGrantSchema = new mongoose.Schema(
  {
    user: {
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

    accessRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessRequest",
      required: true,
    },

    accessLevel: {
      type: String,
      enum: ["READ", "WRITE", "ADMIN"],
      required: true,
    },

    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    revokeReason: {
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

accessGrantSchema.index({ user: 1 });
accessGrantSchema.index({ resource: 1 });
accessGrantSchema.index({ project: 1 });
accessGrantSchema.index({ accessRequest: 1 });
accessGrantSchema.index({ isActive: 1 });
accessGrantSchema.index({ expiresAt: 1 });

module.exports = mongoose.model(
  "AccessGrant",
  accessGrantSchema
);