import express from "express";
import { User } from "../models/user.js";
import { Kyc, validateKyc } from "../models/kyc.js";

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
		folder: "traders",
		allowed_formats: ["jpg", "jpeg", "png", "gif"],
		transformation: [{ width: 500, height: 500, crop: "limit" }],
	},
});

export const upload = multer({ storage: storage });

const router = express.Router();

// getting all kycs
router.get("/", async (req, res) => {
	try {
		const kycs = await Kyc.find().sort({ _id: -1 });
		res.send(kycs);
	} catch (x) {
		return res.status(500).send({ message: "Something Went Wrong..." });
	}
});

// getting a kyc
router.get("/:id", async (req, res) => {
	const { id } = req.params;
	try {
		const kyc = await Kyc.findById(id);
		if (!kyc) return res.status(404).send({ message: "Kyc not found..." });
		res.send(kyc);
	} catch (e) {
		for (i in e.errors) res.status(500).send({ message: e.errors[i].message });
	}
});

//Create KYC
router.post("/", upload.fields([{ name: "documentFront" }, { name: "documentBack" }]), async (req, res) => {
	const { name, email, documentNumber, documentExpDate } = req.body;
	const { error } = validateKyc({ name, email, documentNumber, documentExpDate });

	if (error) return res.status(400).send({ message: error.details[0].message });

	// Prevent duplicates
	const existingKyc = await Kyc.findOne({ $or: [{ email }, { documentNumber }] });
	if (existingKyc) return res.status(400).send({ message: "KYC already exists." });

	// Get uploaded file URLs
	const files = req.files;
	const documentFront = files?.documentFront?.[0]?.path || "";
	const documentBack = files?.documentBack?.[0]?.path || "";

	const newKyc = new Kyc({
		name,
		email,
		documentNumber,
		documentExpDate,
		documentFront,
		documentBack,
	});

	try {
		const result = await newKyc.save();
		res.send(result);
	} catch (e) {
		console.error(e);
		res.status(500).send({ message: "Something went wrong." });
	}
});

// approving a kyc
router.put("/", async (req, res) => {
	const { email, kyc } = req.body;

	try {
		const user = await User.findOne({ email });
		const userKyc = await Kyc.findOne({ $or: [{ email }, { kyc }] });

		if (!user) return res.status(404).send({ message: "User not found..." });
		if (!userKyc) return res.status(404).send({ message: "KYC not found..." });

		// ✅ Approve KYC
		userKyc.status = true;

		// ✅ Update user fields from KYC
		user.idVerified = true;
		user.documentNumber = userKyc.documentNumber;
		user.documentExpDate = userKyc.documentExpDate;
		user.documentFront = userKyc.documentFront;
		user.documentBack = userKyc.documentBack;

		await Promise.all([user.save(), userKyc.save()]);

		res.send({ message: "KYC approved and user updated successfully." });
	} catch (e) {
		console.error(e);
		res.status(500).send({ message: "Something went wrong." });
	}
});

export default router;
