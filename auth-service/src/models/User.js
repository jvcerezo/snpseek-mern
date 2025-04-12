import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  middleName: { type: String, required: false, trim: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true },
  role: { type: String, enum: ["USER", "GUEST"], default: "GUEST" },
}, {
  timestamps: true // Auto add createdAt and updatedAt
});

const User = mongoose.model("User", userSchema);
export default User;
