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
import utilsRoutes from "./routes/utils.js";
import kycsRoutes from "./routes/kycs.js";
import planRoutes from "./routes/plans.js";

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

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/deposits", depositsRoutes);
app.use("/api/withdrawals", withdrawalsRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/kycs", kycsRoutes);
app.use('/api/plans', planRoutes);

// Listening to port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.get("/", (req, res) => {
	res.header("Access-Control-Allow-Origin", "*").send("API running 🥳");
});
