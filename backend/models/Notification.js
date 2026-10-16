
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: [
        "ACCESS_REQUEST_SUBMITTED",
        "ACCESS_REQUEST_APPROVED",
        "ACCESS_REQUEST_REJECTED",
        "ACCESS_REVOKED",
      ],
      required: true,
    },

    relatedResourceType: {
      type: String,
      enum: ["AccessRequest", "AccessGrant"],
      default: null,
    },

    relatedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
