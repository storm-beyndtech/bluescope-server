import mongoose from "mongoose";

const traderSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Trader name is required"],
		trim: true,
	},
	profileImage: {
		type: String,
		default: "default-trader.png",
	},
	bio: {
		type: String,
		required: [true, "Trader bio is required"],
		maxlength: [500, "Bio cannot exceed 500 characters"],
	},
	specialization: {
		type: String,
		required: [true, "Trading specialization is required"],
		enum: ["Forex", "Crypto", "Stocks", "Commodities", "Options", "Mixed"],
	},
	experience: {
		type: Number,
		required: [true, "Years of experience is required"],
		min: [1, "Experience must be at least 1 year"],
	},
	profitPercentage: {
		monthly: {
			type: Number,
			default: 0,
		},
		yearly: {
			type: Number,
			default: 0,
		},
	},
	riskLevel: {
		type: String,
		required: [true, "Risk level is required"],
		enum: ["Low", "Medium", "High"],
	},
	tradingStyle: {
		type: String,
		required: [true, "Trading style is required"],
		enum: ["Day Trading", "Swing Trading", "Position Trading", "Scalping"],
	},
	winRate: {
		type: Number,
		min: [0, "Win rate cannot be negative"],
		max: [100, "Win rate cannot exceed 100%"],
		default: 0,
	},
	totalCopiers: {
		type: Number,
		default: 0,
	},
	averageHoldingTime: {
		type: String,
		default: "N/A",
	},
	minimumCopyAmount: {
		type: Number,
		required: [true, "Minimum copy amount is required"],
		min: [0, "Minimum amount cannot be negative"],
	},
	copierFee: {
		type: Number,
		default: 0,
		min: [0, "Fee cannot be negative"],
		max: [100, "Fee cannot exceed 100%"],
	},
	verified: {
		type: Boolean,
		default: false,
	},
	status: {
		type: String,
		enum: ["active", "paused", "terminated"],
		default: "active",
	},
	tradingStreak: {
		type: Number,
		default: 0,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Update timestamp on save
traderSchema.pre("save", function (next) {
	this.updatedAt = Date.now();
	next();
});

export const Trader = mongoose.model("Trader", traderSchema);
