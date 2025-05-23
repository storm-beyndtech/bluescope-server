import mongoose from "mongoose";

// util schema
const utilSchema = new mongoose.Schema({
	coins: [
		{
			name: String,
			address: String,
			network: String,
			price: Number,
		},
	],
});

// util model
export const Util = mongoose.model("Util", utilSchema);
