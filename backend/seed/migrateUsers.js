const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Role = require("../models/Role");

dotenv.config();

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Find the DEVELOPER role
    const developerRole = await Role.findOne({
      name: "DEVELOPER",
    });

    if (!developerRole) {
      throw new Error("DEVELOPER role not found");
    }

    // Access the native MongoDB users collection directly.
    // This allows us to find old users whose role is stored as a string.
    const usersCollection = mongoose.connection.db.collection("users");

    const result = await usersCollection.updateMany(
      {
        role: "DEVELOPER",
      },
      {
        $set: {
          role: developerRole._id,
        },
      }
    );

    console.log(`Users matched: ${result.matchedCount}`);
    console.log(`Users migrated: ${result.modifiedCount}`);

    console.log("User migration completed");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);

    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateUsers();