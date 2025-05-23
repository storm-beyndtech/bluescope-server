import mongoose from "mongoose";

const demoTradeSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
		},
		symbol: {
			type: String,
			required: true,
		},
		marketDirection: {
			type: String,
			enum: ["buy", "sell"],
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		profitPercent: {
			type: Number,
			default: 81,
			required: true,
		},
		profit: {
			type: Number,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: { createdAt: true, updatedAt: true } },
);

export const DemoTrade = mongoose.model("demoTrade", demoTradeSchema);
