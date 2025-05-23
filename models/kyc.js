import Joi from "joi";
import mongoose from "mongoose";

// Kyc schema
const kycSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		minLength: 5,
		maxLength: 225,
	},
	email: {
		type: String,
		required: true,
		minLength: 5,
		maxLength: 225,
	},
	documentFront: { type: String },
	documentBack: { type: String },
	documentNumber: { type: String },
	documentExpDate: { type: String },
	status: {
		type: Boolean,
		default: false,
	},
});

// kyc model
export const Kyc = mongoose.model("Kyc", kycSchema);

// validate Kyc
export function validateKyc(kyc) {
	const schema = Joi.object({
		name: Joi.string().min(5).max(225).required(),
		email: Joi.string().email().min(5).max(225).required(),
		documentNumber: Joi.string().min(3).max(50).required(),
		documentExpDate: Joi.string().required(), // optionally add pattern for date
	});
	return schema.validate(kyc);
}
