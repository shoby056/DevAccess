
const Notification = require("../models/Notification");

// GET MY NOTIFICATIONS
const getMyNotifications = async (req, res, next) => {
  try {
    if (!req.currentUser || !req.currentUser._id) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50
    );

    const recipient = req.currentUser._id;

    console.log("\n--- GET MY NOTIFICATIONS ---");
    console.log("User ID:", recipient.toString());
    console.log("User email:", req.currentUser.email);

    const [notifications, total, unreadCount] =
      await Promise.all([
        Notification.find({ recipient })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),

        Notification.countDocuments({ recipient }),

        Notification.countDocuments({
          recipient,
          isRead: false,
        }),
      ]);

    console.log("Total notifications:", total);
    console.log("Unread notifications:", unreadCount);

    console.log(
      "Notification details:",
      notifications.map((item) => ({
        id: item._id.toString(),
        recipient: item.recipient.toString(),
        title: item.title,
        type: item.type,
        isRead: item.isRead,
      }))
    );

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    next(error);
  }
};

// MARK ONE NOTIFICATION AS READ
const markNotificationAsRead = async (req, res, next) => {
  try {
    if (!req.currentUser || !req.currentUser._id) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.currentUser._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// MARK ALL NOTIFICATIONS AS READ
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    if (!req.currentUser || !req.currentUser._id) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const result = await Notification.updateMany(
      {
        recipient: req.currentUser._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
