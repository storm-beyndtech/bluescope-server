import bcrypt from "bcrypt";
import express from "express";
import { User } from "../models/user.js";
import { passwordResetCode, passwordResetConfirmation, referralJoin, welcomeMail } from "../utils/mailer.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Otp } from "../models/otp.js";

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET,
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "profile",
		allowed_formats: ["jpg", "jpeg", "png", "gif"],
		transformation: [{ width: 500, height: 500, crop: "limit" }],
	},
});

export const upload = multer({ storage: storage });

const router = express.Router();

//Get QR Code For 2FA
router.get("/getQrcode", async (req, res) => {
	const secret = speakeasy.generateSecret({ name: "ameritrades" });

	qrcode.toDataURL(secret.otpauth_url, (err, data) => {
		res.send({ imgSrc: data, secret });
	});
});

// GET /referrals/:username
router.get("/referrals/:username", async (req, res) => {
	const { username } = req.params;

	try {
		// Find all users referred by the given username
		const referrals = await User.find({ referredBy: username }).select("username createdAt");

		res.status(200).json(
			referrals.map((ref) => ({
				username: ref.username,
				date: ref.createdAt,
			})),
		);
	} catch (error) {
		console.error("Error fetching referrals:", error);
		res.status(500).json({ message: "Server error while fetching referrals." });
	}
});

router.get("/:id", async (req, res) => {
	try {
		let user = await User.findById(req.params.id);
		if (!user) return res.status(400).send({ message: "user not found" });
		res.send({ user });
	} catch (x) {
		return res.status(500).send({ message: "Something Went Wrong..." });
	}
});

// Getting all users sorted by creation date (newest first)
router.get("/", async (req, res) => {
	try {
		const users = await User.find().sort({ createdAt: -1 });
		res.send(users);
	} catch (error) {
		return res.status(500).send({ message: "Something Went Wrong..." });
	}
});

// reset password
router.get("/reset-password/:email", async (req, res) => {
	const { email } = req.params;
	if (!email) return res.status(400).send({ message: "Email is required" });

	try {
		const emailData = await passwordReset(email);
		if (emailData.error) return res.status(400).send({ message: emailData.error });

		res.send({ message: "Password reset link sent successfully" });
	} catch (error) {
		return res.status(500).send({ message: "Something Went Wrong..." });
	}
});

// login user
router.post("/login", async (req, res) => {
	const { email, username, password } = req.body;

	try {
		const user = await User.findOne({
			$or: [{ email }, { username }],
		});
		if (!user) return res.status(400).send({ message: "user not found" });

		const validatePassword = bcrypt.compare(password, user.password);
		if (!validatePassword) return res.status(400).send({ message: "Invalid password" });

		const { password: _, ...userData } = user.toObject();
		res.send({ message: "success", user: userData });
	} catch (error) {
		for (i in e.errors) res.status(500).send({ message: e.errors[i].message });
		console.log(e.errors[0].message);
	}
});

// signup
router.post("/signup", async (req, res) => {
	const { firstName, lastName, username, email, password, country, phone, referrer } = req.body;

	try {
		// Check for existing user
		const existingUser = await User.findOne({ $or: [{ email }, { username }] });
		if (existingUser) {
			return res
				.status(400)
				.send({ success: false, message: "Username or email already exists. Please login." });
		}

		// Hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create and save new user
		const user = new User({ firstName, lastName, username, email, password: hashedPassword, country, phone });
		if (referrer) {
			const referrerUser = await User.findOne({ username: referrer });
			if (referrerUser) {
				user.referral = {
					code: referrerUser.username,
					status: "pending",
				};

				await referralJoin(referrerUser.email, referrerUser.fullName, user.username, new Date());
			}
		}
		await user.save();

		// Respond with user (excluding password)
		const { password: _, ...userData } = user.toObject();
		return res.send({ success: true, user: userData });
	} catch (e) {
		console.error(e);
		const message = e.message || "Something went wrong during signup.";
		return res.status(500).send({ success: false, message });
	}
});

//Change password
router.put("/change-password", async (req, res) => {
	const { currentPassword, newPassword, id } = req.body;

	try {
		const user = await User.findById(id);
		if (!user) return res.status(404).send({ message: "User not found" });

		const validPassword = await bcrypt.compare(currentPassword, user.password);
		if (!validPassword) return res.status(400).send({ message: "Current password is incorrect" });

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(newPassword, salt);
		await user.save();

		res.send({ message: "Password changed successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).send({ message: "Server error" });
	}
});

// Request password reset
router.post("/forgot-password", async (req, res) => {
	const { email } = req.body;

	try {
		// Validate email
		if (!email) {
			return res.status(400).send({ message: "Email is required" });
		}

		// Check if user exists
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).send({ message: "No account found with this email address" });
		}

		// Delete any existing OTP for this email
		await Otp.deleteMany({ email });

		// Create new OTP (code is auto-generated by the model)
		const otpRecord = new Otp({ email });
		await otpRecord.save();

		// Send reset code email
		await passwordResetCode(email, otpRecord.code);

		res.send({ 
			message: "Reset code sent to your email address",
			email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3") // Partially hide email
		});

	} catch (err) {
		console.error("Forgot password error:", err);
		res.status(500).send({ message: "Failed to send reset code. Please try again." });
	}
});

// Reset password with code
router.post("/reset-password", async (req, res) => {
	const { email, resetCode, newPassword } = req.body;

	try {
		// Validate input
		if (!email || !resetCode || !newPassword) {
			return res.status(400).send({ message: "All fields are required" });
		}

		if (newPassword.length < 6) {
			return res.status(400).send({ message: "Password must be at least 6 characters long" });
		}

		// Find valid OTP record
		const otpRecord = await Otp.findOne({ email, code: resetCode });
		if (!otpRecord) {
			return res.status(400).send({ message: "Invalid or expired reset code" });
		}

		// Find user and update password
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).send({ message: "User not found" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		// Update user password
		user.password = hashedPassword;
		await user.save();

		// Delete the used OTP
		await Otp.deleteOne({ _id: otpRecord._id });

		// Send confirmation email
		await passwordResetConfirmation(email, user.fullName || user.firstName || "Valued Customer");

		res.send({ message: "Password reset successful!" });
	} catch (err) {
		console.error("Reset password error:", err);
		res.status(500).send({ message: "Failed to reset password. Please try again." });
	}
});

// Resend reset code
router.post("/resend-reset-code", async (req, res) => {
	const { email } = req.body;

	try {
		if (!email) {
			return res.status(400).send({ message: "Email is required" });
		}

		// Check if user exists
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).send({ message: "No account found with this email address" });
		}

		// Check if there's a recent request (prevent spam)
		const recentOtp = await Otp.findOne({ 
			email, 
			createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // Within last minute
		});
		
		if (recentOtp) {
			return res.status(429).send({ message: "Please wait before requesting another code" });
		}

		// Delete any existing OTP for this email
		await Otp.deleteMany({ email });

		// Create new OTP
		const otpRecord = new Otp({ email });
		await otpRecord.save();

		// Send new reset code email
		await passwordResetCode(email, otpRecord.code);

		res.send({ message: "New reset code sent to your email address" });

	} catch (err) {
		console.error("Resend reset code error:", err);
		res.status(500).send({ message: "Failed to resend reset code" });
	}
});

router.put("/update-profile", upload.single("profileImage"), async (req, res) => {
	const { email, ...rest } = req.body;

	let user = await User.findOne({ email });
	if (!user) return res.status(404).send({ message: "User not found" });

	try {
		if (req.file) {
			rest.profileImage = req.file.path;
		}

		user.set(rest);
		user = await user.save();

		res.send({ user });
	} catch (e) {
		for (const i in e.errors) {
			return res.status(500).send({ message: e.errors[i].message });
		}
	}
});

// Delete single user by email
router.delete("/:email", async (req, res) => {
	const { email } = req.params;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	try {
		const result = await User.deleteOne({ email });

		if (result.deletedCount === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		res.json({ success: true, deletedCount: result.deletedCount });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to delete user" });
	}
});

// Veryify 2FA for user
router.post("/verifyToken", async (req, res) => {
	const { token, secret, email } = req.body;

	let user = await User.findOne({ email });
	if (!user) return res.status(400).send({ message: "Invalid email" });

	try {
		const verify = speakeasy.totp.verify({
			secret,
			encoding: "ascii",
			token,
		});

		if (!verify) throw new Error("Invalid token");
		else {
			user.mfa = true;
			user = await user.save();
			res.send({ message: "Your Account Multi Factor Authentication is Now on" });
		}
	} catch (error) {
		return res.status(500).send({ message: "Something Went Wrong..." });
	}
});

export default router;
