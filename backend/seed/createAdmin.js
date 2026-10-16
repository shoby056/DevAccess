const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Role = require("../models/Role");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const adminRole = await Role.findOne({
      name: "SUPER_ADMIN",
    });

    if (!adminRole) {
      throw new Error(
        "SUPER_ADMIN role not found. Run npm run seed first."
      );
    }

    const email = "admin@devaccess.local";
    const password = "Admin123456";

    const hashedPassword = await bcrypt.hash(password, 12);

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.name = "DevAccess Super Admin";
      existingAdmin.password = hashedPassword;
      existingAdmin.role = adminRole._id;
      existingAdmin.isActive = true;

      await existingAdmin.save();

      console.log("Existing SUPER_ADMIN updated");
    } else {
      await User.create({
        name: "DevAccess Super Admin",
        email,
        password: hashedPassword,
        role: adminRole._id,
        isActive: true,
      });

      console.log("SUPER_ADMIN created");
    }

    console.log("Admin email:", email);
    console.log("Admin password:", password);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Admin creation failed:", error.message);

    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();