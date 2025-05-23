import express from "express";
import { Transaction } from "../models/transaction.js";
import { User } from "../models/user.js";
import mongoose from "mongoose";
import { DemoTrade } from "../models/DemoTrade.js";

const router = express.Router();

function parseDuration(durationStr) {
	const match = durationStr.match(/^(\d+)s$/);
	if (!match) return 5000; // default to 5 seconds if invalid

	return parseInt(match[1], 10) * 1000;
}

router.get("/", async (req, res) => {
	try {
		const trades = await Transaction.find({ type: "trade" }).sort({ date: "asc" });
		res.send(trades);
	} catch (error) {
		console.error(error);
		return res.status(500).send({ message: "Something Went Wrong..." });
	}
});

// Get all demo trades for a user
router.get("/demo-trades/:email", async (req, res) => {
	try {
		const { email } = req.params;
		const trades = await DemoTrade.find({ email }).sort({ createdAt: -1 });

		res.status(200).json({ trades });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.post("/create-demo-trade", async (req, res) => {
	try {
		const { email, symbol, marketDirection, amount, duration, profit } = req.body;

		const newTrade = await DemoTrade.create({
			email,
			symbol,
			marketDirection,
			amount,
			duration,
			profit,
		});

		res.status(201).json({ message: "Trade created", trade: newTrade });

		const durationMs = parseDuration(duration);

		setTimeout(async () => {
			try {
				const user = await User.findOne({ email });
				if (!user) return;

				const win = Math.random() > 0.5;
				let updatedBalance;

				if (win) {
					updatedBalance = user.demo + profit;
					console.log(`User ${email} won the trade. +${profit}`);
				} else {
					updatedBalance = user.demo - amount;
					console.log(`User ${email} lost the trade. -${amount}`);
				}

				user.demo = updatedBalance;
				await user.save();
				console.log(`Demo balance updated to ${updatedBalance} for ${email}`);
      } catch (err) {
				console.error("Failed to update demo balance after trade:", err);
        throw new Error("Failed to update demo balance after trade");
        
			}
		}, durationMs);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// making a trade
router.post("/", async (req, res) => {
	const { package: plan, interest } = req.body;

	try {
		const trade = new Transaction({
			tradeData: { package: plan, interest },
			type: "trade",
			amount: 0,
		});

		await trade.save();

		res.status(200).send({ message: "Success" });
	} catch (error) {
		for (i in error.errors) res.status(500).send({ message: error.errors[i].message });
	}
});

// updating a trade
router.put("/:id", async (req, res) => {
	const { id } = req.params;
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const trade = await Transaction.findById(id).session(session);
		if (!trade) {
			await session.abortTransaction();
			session.endSession();
			return res.status(404).send({ message: "Trade not found" });
		}

		// Check and update user balances
		const users = await User.find({ deposit: { $gt: 0 } }).session(session);

		for (const user of users) {
			const calculatedInterest = trade.tradeData.interest * user.deposit;
			user.interest += calculatedInterest;
			await user.save({ session });
		}

		// Update trade status
		if (trade.status === "pending") {
			trade.status = "success";
		}

		await trade.save({ session });
		await session.commitTransaction();
		session.endSession();

		res.send({ message: "Trade successfully updated" });
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		console.error(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

// deleting a trade
router.delete("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const trade = await Transaction.findByIdAndRemove(id);
		if (!trade) return res.status(404).send({ message: "Trade not found" });

		res.send(trade);
	} catch (error) {
		for (i in error.errors) res.status(500).send({ message: error.errors[i].message });
	}
});

export default router;
