import express from "express";
import { Transaction } from "../models/transaction.js";
import { User } from "../models/user.js";
import { alertAdmin, depositRequested, depositStatus, referralCommission } from "../utils/mailer.js";

const router = express.Router();

// Get deposits with basic filters
router.get("/", async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "", status = "all", userId = "" } = req.query;

		// Build filter
		const filter = { type: "deposit" };

		if (userId) filter["user.id"] = userId;
		if (status !== "all") filter.status = status;
		if (search) {
			const searchRegex = new RegExp(search, "i");
			filter.$or = [
				{ transactionNumber: searchRegex },
				{ "user.email": searchRegex },
				{ "walletData.coinName": searchRegex },
			];
		}

		// Pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [deposits, total] = await Promise.all([
			Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
			Transaction.countDocuments(filter),
		]);

		// Format response
		const formattedDeposits = deposits.map((deposit) => ({
			_id: deposit._id,
			transactionNumber: deposit.transactionNumber,
			amount: deposit.amount,
			convertedAmount: deposit.walletData?.convertedAmount || 0,
			coinName: deposit.walletData?.coinName || "Unknown",
			status: deposit.status,
			date: deposit.date,
			userId: deposit.user?.id,
		}));

		res.json({
			deposits: formattedDeposits,
			totalPages: Math.ceil(total / parseInt(limit)),
			currentPage: parseInt(page),
			totalDeposits: total,
		});
	} catch (e) {
		res.status(500).json({ message: "Failed to fetch deposits" });
	}
});

// Making a deposit
router.post("/", async (req, res) => {
	const { id, amount, convertedAmount, coinName, network, address } = req.body;

	try {
		const user = await User.findById(id);
		if (!user) return res.status(400).json({ message: "Something went wrong" });

		// Check for pending deposit
		const pendingDeposit = await Transaction.findOne({
			"user.id": id,
			status: "pending",
			type: "deposit",
		});

		if (pendingDeposit) {
			return res.status(400).json({ message: "You have a pending deposit. Please wait for approval." });
		}

		const userData = {
			id: user._id,
			email: user.email,
			name: user.username,
		};

		const walletData = {
			convertedAmount,
			coinName,
			network,
			address,
		};

		// Create deposit
		const transaction = new Transaction({ type: "deposit", user: userData, amount, walletData });
		await transaction.save();

		// Send admin alert
		await alertAdmin(user.email, amount, transaction.date, "deposit");
		// Send deposit email
		await depositRequested(user.email, user.fullName, amount, transaction.date);

		res.json({ message: "Deposit successful and pending approval..." });
	} catch (e) {
		res.status(500).json({ message: "Something went wrong" });
	}
});

// Update deposit (admin)
router.put("/:id", async (req, res) => {
	const { id } = req.params;
	const { email, amount, status } = req.body;

	try {
		let deposit = await Transaction.findById(id);
		if (!deposit) return res.status(404).json({ message: "Deposit not found" });

		let user = await User.findOne({ email });
		if (!user) return res.status(400).json({ message: "Something went wrong" });

		deposit.status = status;

		if (status === "approved") {
			user.deposit += amount;

			// 💰 Reward the referrer with 5% if exists
			if (user.referral.code !== "") {
				const referrer = await User.findOne({
					username: user.referral.code,
				});

				if (referrer) {
					const bonus = 0.05 * amount;
					referrer.deposit += bonus;
					await referrer.save();
					await referralCommission(referrer.email, referrer.fullName, bonus, deposit.date, user.fullName);
				}
			}
		}

		await user.save();
		await deposit.save();

		// Send confirmation email
		if (status === "approved") {
			await depositStatus(user.email, user.fullName, amount, deposit.date, true);
		} else {
			await depositStatus(user.email, user.fullName, amount, deposit.date, false);
		}

		res.json({ message: "Deposit successfully updated" });
	} catch (e) {
		res.status(500).json({ message: "Something went wrong" });
	}
});

export default router;
