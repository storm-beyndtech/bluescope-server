import Joi from "joi";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export const userSchema = new mongoose.Schema({
	title: { type: String, maxLength: 10 },
	firstName: { type: String, maxLength: 30 },
	lastName: { type: String, maxLength: 30 },
	fullName: {
		type: String,
		maxLength: 60,
		default: "",
	},
	username: {
		type: String,
		required: true,
		minLength: 3,
		maxLength: 20,
	},
	email: {
		type: String,
		required: true,
		minLength: 5,
		maxLength: 225,
	},
	phone: {
		type: String,
		maxLength: 15,
		default: "",
	},
	dob: { type: String, default: "" },
	houseNo: { type: String, maxLength: 20, default: "" },
	streetAddress: { type: String, maxLength: 100, default: "" },
	city: {
		type: String,
		maxLength: 50,
		default: "",
	},
	province: {
		type: String,
		maxLength: 50,
		default: "",
	},
	zipCode: {
		type: String,
		maxLength: 50,
		default: "",
	},
	taxResidency: { type: String, maxLength: 50 },
	country: {
		type: String,
		maxLength: 50,
		default: "United States", // optional default
	},
	annualIncome: { type: String },
	incomeSource: { type: String },
	instruments: { type: String },
	preferredMarkets: { type: String },
	knowledgeLevel: { type: String },
	tradingFrequency: { type: String },
	tradingPlatforms: { type: String },
	yearsTrading: { type: String },

	documentFront: { type: String },
	documentBack: { type: String },
	documentNumber: { type: String },
	documentExpDate: { type: String },

	password: {
		type: String,
		required: true,
		minLength: 5,
		maxLength: 1000,
	},
	deposit: {
		type: Number,
		default: 0,
		minLength: 0,
	},
	demo: {
		type: Number,
		default: 0,
		minLength: 0,
	},
	interest: {
		type: Number,
		default: 0,
		minLength: 0,
	},
	withdraw: {
		type: Number,
		default: 0,
		minLength: 0,
	},
	bonus: {
		type: Number,
		default: 0,
		minLength: 0,
	},
	referredBy: {
		type: String,
		default: "",
		maxLength: 50,
	},
	profileImage: {
		type: String,
		default: "",
		maxLength: 500,
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
	mfa: {
		type: Boolean,
		default: false,
	},
	idVerified: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	rank: {
		type: String,
		maxLength: 50,
		default: "welcome",
	},
	traderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Trader",
		default: null,
	},
});

userSchema.methods.genAuthToken = function () {
	return jwt.sign(
		{ _id: this._id, username: this.username, isAdmin: this.isAdmin },
		process.env.JWT_PRIVATE_KEY,
	);
};

userSchema.pre("save", function (next) {
	this.fullName = `${this.firstName && this.firstName} ${this.lastName && this.lastName}`;
	next();
});

export const User = mongoose.model("User", userSchema);

export const validateUser = (user) => {
	const schema = {
		username: Joi.string().min(3).max(20).required(),
		email: Joi.string().min(5).max(225).required(),
		password: Joi.string().min(5).max(20),
		referredBy: Joi.string().min(0).max(50).allow(""),
	};

	return Joi.validate(user, schema);
};

export const validateLogin = (user) => {
	const schema = {
		email: Joi.string().min(5).max(225).email().allow(""),
		username: Joi.string().min(3).max(20).allow(""),
		password: Joi.string().min(5).max(20).required(),
	};

	return Joi.validate(user, schema);
};
