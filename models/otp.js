import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 225
  },
  code: {
    type: String,
    default: function () {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300
  }
});



export const Otp = mongoose.model("Otp", otpSchema);