import Joi from "joi";
import mongoose from "mongoose";

// Kyc schema
const kycSchema = new mongoose.Schema({
	name: {
    type: String,
    default: "",
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
		name: Joi.string().allow(" "),
		email: Joi.string().email().min(5).max(225).required(),
		documentNumber: Joi.string().min(3).max(50).required(),
		documentExpDate: Joi.string().required(),
	});
	return schema.validate(kyc);
}
