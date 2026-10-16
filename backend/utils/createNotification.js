
const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  title,
  message,
  type,
  relatedResourceType = null,
  relatedResourceId = null,
}) => {
  try {
    if (!recipient) {
      throw new Error("Notification recipient is required");
    }

    return await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedResourceType,
      relatedResourceId,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

module.exports = createNotification;
