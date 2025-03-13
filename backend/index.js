const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://vegetable-retail-store-dashboard.vercel.app/",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: "https://vegetable-retail-store-dashboard.vercel.app/",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Attach io to req before defining routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// MongoDB Connection
mongoose.connect('mongodb+srv://veggie:veggie179@cluster0.h3qloyh.mongodb.net/myDatabase?retryWrites=true&w=majority')
  .then(() => console.log("Connected to MongoDB server"))
  .catch(err => console.log("MongoDB error: " + err.message));

// Routes
const farmerRoutes = require("./routes/farmerRoute");
const vegetableRoutes = require("./routes/vegetableRoute");
const stockRoutes = require("./routes/stockRoute");
const customerRoutes = require("./routes/customerRoute");
const groupRoutes = require("./routes/groupRoute");
const creditRoutes = require("./routes/creditRoute");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoute");
const salesRoutes = require("./routes/salesRoute");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/vegetables", vegetableRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/sales", salesRoutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
