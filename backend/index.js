const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 5000;
const farmerRoutes = require("./routes/farmerRoute");
const vegetableRoutes = require("./routes/vegetableRoute");
const stockRoutes = require("./routes/stockRoute");
const customerRoutes = require("./routes/customerRoute");
const groupRoutes = require("./routes/groupRoute");
const creditRoutes = require("./routes/creditRoute");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoute");
const salesRoutes = require("./routes/salesRoute");

app.use(express.json());
app.use(cors({
    origin: "https://vegetable-retail-store-dashboard.vercel.app", // Your frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true
  }));

mongoose.connect('mongodb+srv://veggie:veggie179@cluster0.h3qloyh.mongodb.net/myDatabase?retryWrites=true&w=majority')
.then(() => console.log("Connected to MongoDB server"))
.catch(err => console.log("MongoDB error: " + err.message));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/vegetables", vegetableRoutes);
app.use("/api/stocks",stockRoutes);
app.use("/api/customers",customerRoutes);
app.use("/api/groups",groupRoutes);
app.use("/api/credits",creditRoutes);
app.use("/api/sales",salesRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
