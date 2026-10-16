const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    type: {
      type: String,
      required: [true, "Resource type is required"],
      enum: [
        "REPOSITORY",
        "DATABASE",
        "API",
        "SERVER",
        "CLOUD_SERVICE",
        "STORAGE",
        "OTHER",
      ],
      default: "OTHER",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },

    environment: {
      type: String,
      enum: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
      default: "DEVELOPMENT",
    },

    url: {
      type: String,
      trim: true,
      default: "",
    },

    sensitivity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ name: 1 });
resourceSchema.index({ project: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ environment: 1 });
resourceSchema.index({ sensitivity: 1 });

module.exports = mongoose.model("Resource", resourceSchema);