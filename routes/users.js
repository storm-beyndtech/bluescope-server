import bcrypt from "bcrypt";
import express from "express";
import { User, validateUser, validateLogin } from "../models/user.js";
import { passwordReset, welcomeMail, otpMail } from "../utils/mailer.js";
import { Otp } from "../models/otp.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

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
	console.log(req.body);
	const { error } = validateLogin(req.body);
	if (error) return res.status(400).send({ message: error.details[0].message });

	try {
		const user = await User.findOne({
			$or: [{ email }, { username }],
		});
		if (!user) return res.status(400).send({ message: "user not found" });

		const validatePassword = await bcrypt.compare(password, user.password);
		if (!validatePassword) return res.status(400).send({ message: "Invalid password" });

		const otp = await new Otp({ email: user.email }).save();
		const emailData = await otpMail(user.email, otp.code);
		if (emailData.error) return res.status(400).send({ message: emailData.error });

		res.send({ message: "success" });
	} catch (error) {
		for (i in e.errors) res.status(500).send({ message: e.errors[i].message });
		console.log(e.errors[0].message);
	}
});

//sign up
router.post("/signup", async (req, res) => {
	const { username, email } = req.body;

	const { error } = validateUser(req.body);
	if (error) return res.status(400).send({ message: error.details[0].message });

	let user = await User.findOne({ $or: [{ email }, { username }] });
	if (user) return res.status(400).send({ message: "username or email already exists, please login" });

	try {
		const otp = await new Otp({ email }).save();
		const emailData = await otpMail(email, otp.code);
		if (emailData.error) return res.status(400).send({ message: emailData.error });

		res.send({ message: "success" });
	} catch (e) {
		for (i in e.errors) res.status(500).send({ message: e.errors[i].message });
	}
});

//create a new user
router.post("/verify-otp", async (req, res) => {
	const { username, email, password, referredBy, type } = req.body;
	console.log(req.body);
	try {
		let user = await User.findOne({
			$or: [{ email }, { username }],
		});

		if (type === "register-verification") {
			if (user) return res.status(400).send({ message: "User already exists, please login" });

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);

			user = new User({ username, email, password: hashedPassword, referredBy });
			await user.save();

			await welcomeMail(user.email);
			return res.send({ user });
		}

		if (type === "login-verification") {
			if (!user) return res.status(400).send({ message: "User not found, please register" });
			console.log(req.body, "2");
			const validPassword = await bcrypt.compare(password, user.password);
			if (!validPassword) return res.status(400).send({ message: "Invalid password" });

			return res.send({ user });
		}

		return res.status(400).send({ message: "Invalid type. Must be 'register' or 'login'" });
	} catch (e) {
		console.error(e);
		return res.status(500).send({ message: "Server error" });
	}
});

//resend - otp
router.post("/resend-otp", async (req, res) => {
	const { email } = req.body;

	try {
		const otp = await new Otp({ email }).save();
		const emailData = await otpMail(email, otp.code);
		if (emailData.error) return res.status(400).send({ message: emailData.error });

		res.send({ message: "success" });
	} catch (e) {
		for (i in e.errors) res.status(500).send({ message: e.errors[i].message });
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

// new password
router.put("/new-password", async (req, res) => {
	const { email, password } = req.body;
	if (!email) return res.status(400).send({ message: "Email is required" });

	let user = await User.findOne({ email });
	if (!user) return res.status(400).send({ message: "Invalid email" });

	try {
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(password, salt);
		user = await user.save();
		res.send({ message: "Password changed successfully" });
	} catch (error) {
		return res.status(500).send({ message: "Something Went Wrong..." });
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

//Delete multi users
router.delete("/", async (req, res) => {
	const { userIds, usernamePrefix, emailPrefix } = req.body;

	// Build the filter dynamically
	const filter = {};

	// Filter by IDs if provided
	if (Array.isArray(userIds) && userIds.length > 0) {
		filter._id = { $in: userIds };
	}

	// Filter by username prefix if provided
	if (usernamePrefix) {
		filter.username = { $regex: `^${usernamePrefix}`, $options: "i" }; // Case-insensitive match
	}

	// Filter by email prefix if provided
	if (emailPrefix) {
		filter.email = { $regex: `^${emailPrefix}`, $options: "i" }; // Case-insensitive match
	}

	// Check if the filter is empty
	if (Object.keys(filter).length === 0) {
		return res.status(400).json({ error: "No valid filter criteria provided" });
	}

	try {
		const result = await User.deleteMany(filter);
		res.json({ success: true, deletedCount: result.deletedCount });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to delete users" });
	}
});

// PUT /api/user/
router.put("/update-user-trader", async (req, res) => {
	try {
		const { traderId, action, userId } = req.body;

		if (!userId) return res.status(401).json({ message: "Unauthorized" });

		const update = action === "copy" ? { traderId } : { $unset: { traderId: 1 } };

		const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });

		return res.status(200).json({
			message: action === "copy" ? "Trader copied" : "Trader uncopied",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Error updating traderId:", error);
		return res.status(500).json({ message: "Internal server error" });
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
