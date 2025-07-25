import express from "express";
import { Transaction } from "../models/transaction.js";
import { User } from "../models/user.js";
import { alertAdmin, withdrawRequested, withdrawStatus } from "../utils/mailer.js";

const router = express.Router();

// Get withdrawals with basic filters
router.get("/", async (req, res) => {
	try {
		const { page = 1, limit = 10, search = "", status = "all", userId = "" } = req.query;

		// Build filter
		const filter = { type: "withdrawal" };

		if (userId) filter["user.id"] = userId;
		if (status !== "all") filter.status = status;
		if (search) {
			const searchRegex = new RegExp(search, "i");
			filter.$or = [
				{ transactionNumber: searchRegex },
				{ "user.email": searchRegex },
				{ "walletData.coinName": searchRegex },
				{ "walletData.network": searchRegex },
			];
		}

		// Pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [withdrawals, total] = await Promise.all([
			Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
			Transaction.countDocuments(filter),
		]);

		// Format response
		const formattedWithdrawals = withdrawals.map((withdrawal) => ({
			_id: withdrawal._id,
			transactionNumber: withdrawal.transactionNumber,
			amount: withdrawal.amount,
			convertedAmount: withdrawal.walletData?.convertedAmount || 0,
			coinName: withdrawal.walletData?.coinName || "Unknown",
			network: withdrawal.walletData?.network || "Unknown",
			address: withdrawal.walletData?.address || "",
			status: withdrawal.status,
			date: withdrawal.date,
			userId: withdrawal.user?.id,
			user: withdrawal.user,
		}));

		res.json({
			withdrawals: formattedWithdrawals,
			totalPages: Math.ceil(total / parseInt(limit)),
			currentPage: parseInt(page),
			totalWithdrawals: total,
		});
	} catch (e) {
		res.status(500).json({ message: "Failed to fetch withdrawals" });
	}
});

// Getting single withdrawal
router.get("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const withdrawal = await Transaction.findById(id);
		if (!withdrawal) return res.status(404).json({ message: "Transaction not found" });
		res.json(withdrawal);
	} catch (e) {
		res.status(500).json({ message: "Something went wrong" });
	}
});

// Get all withdrawals by user
router.get("/user/:email", async (req, res) => {
	const { email } = req.params;

	try {
		const withdrawals = await Transaction.find({
			"user.email": email,
			type: "withdrawal",
		}).sort({ date: -1 });

		if (!withdrawals || withdrawals.length === 0) {
			return res.status(404).json({ message: "No withdrawals found for this user" });
		}

		res.json(withdrawals);
	} catch (e) {
		res.status(500).json({ message: "Something went wrong" });
	}
});

// Making a withdrawal
router.post("/", async (req, res) => {
	const { id, amount, convertedAmount, coinName, network, address } = req.body;

	try {
		const user = await User.findById(id);
		if (!user) return res.status(400).json({ message: "Something went wrong" });

		// Check if there's any pending withdrawal for the user
		const pendingWithdrawal = await Transaction.findOne({
			"user.id": id,
			status: "pending",
			type: "withdrawal",
		});

		if (pendingWithdrawal) {
			return res.status(400).json({ message: "You have a pending withdrawal. Please wait for approval." });
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

		// Create a new withdrawal instance
		const transaction = new Transaction({ type: "withdrawal", user: userData, amount, walletData });
		await transaction.save();

		// Send admin alert
		await alertAdmin(user.email, amount, transaction.date, "withdrawal");
		// Send withdrawal email
		await withdrawRequested(user.email, user.fullName, amount, transaction.date);

		res.json({ message: "Withdrawal successful and pending approval..." });
	} catch (e) {
		res.status(500).json({ message: "Something went wrong" });
	}
});

// Updating a withdrawal (admin)
router.put("/:id", async (req, res) => {
	const { id } = req.params;
	const { email, amount, status } = req.body;

	try {
		let withdrawal = await Transaction.findById(id);
		if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });

		let user = await User.findOne({ email });
		if (!user) return res.status(400).json({ message: "User not found..." });

		withdrawal.status = status;

		if (status === "approved") {
			const totalBalance = user.deposit + user.interest;
      if (amount > totalBalance) return res.status(400).json({ message: "Insufficient balance." });
      
			if (user.deposit >= amount) {
				user.deposit -= amount;
			} else {
				const remaining = amount - user.deposit;
				user.deposit = 0;
				user.interest -= remaining;
			}

			user.withdraw += amount;
		}

		await user.save();
		await withdrawal.save();

		// Send confirmation email
		if (status === "approved") {
			await withdrawStatus(user.email, user.fullName, amount, withdrawal.date, true);
		} else {
			await withdrawStatus(user.email, user.fullName, amount, withdrawal.date, false);
		}

		res.json({ message: "Withdrawal successfully updated" });
	} catch (e) {
		res.status(500).json({ message: "Something went wrong" });
	}
});

export default router;
