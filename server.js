import express from "express";
import mongoose from "mongoose";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { verifyTransporter } from "./utils/emailConfig.js";
import usersRoutes from "./routes/users.js";
import transactionsRoutes from "./routes/transactions.js";
import depositsRoutes from "./routes/deposits.js";
import withdrawalsRoutes from "./routes/withdrawals.js";
import tradesRoutes from "./routes/trades.js";
import traderRoutes from "./routes/traders.js";
import utilsRoutes from "./routes/utils.js";
import kycsRoutes from "./routes/kycs.js";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Verify transporter
(async function verifyTP() {
	await verifyTransporter();
})();

// Checking for required ENV variables
if (!process.env.JWT_PRIVATE_KEY) {
	console.error("Fatal Error: jwtPrivateKey is required");
	process.exit(1);
}

// Connecting to MongoDB
mongoose.set("strictQuery", false);
mongoose
	.connect(process.env.MONGODB_URL)
	.then(() => console.log("Connected to MongoDB..."))
	.catch((e) => console.error("Error connecting to MongoDB:", e));

// CORS middleware
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	next();
});

// Create a rate limiter for POST requests only
const postLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 POST requests per 15 minutes
	handler: (req, res) => {
		res.status(429).json({
			message: "Too many requests, please try again later.",
		});
	},
});

// Middlewares
app.post("*", postLimiter);
app.use(cors());
app.use(express.json());
app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/deposits", depositsRoutes);
app.use("/api/withdrawals", withdrawalsRoutes);
app.use("/api/trades", tradesRoutes);
app.use("/api/trader", traderRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/kycs", kycsRoutes);

// Listening to port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.get("/", (req, res) => {
	res.header("Access-Control-Allow-Origin", "*").send("API running 🥳");
});
