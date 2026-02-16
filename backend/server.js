require("dotenv").config();
require("express-async-errors");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT || 3500;
const app = express();

console.log(process.env.NODE_ENV);

// Connect MongoDB
connectDB();

// Middleware
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Static files
app.use("/", express.static(path.join(__dirname, "public")));

// Routes
app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/notes", require("./routes/noteRoutes"));
app.use("/api/notes", require("./routes/updateNotes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.use("/api/repairs", require("./routes/repairRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/triage", require("./routes/triage"));

// 404 handler
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// Error handler middleware
app.use(errorHandler);

// ✅ Once MongoDB connects, start server and attach Socket.io
mongoose.connection.once("open", () => {
  console.log("✅ Connected to MongoDB");

  // Create HTTP server
  const server = createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: "https://techrepairnotessystemfrontend.onrender.com", // your React app origin
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store user sockets
  const onlineUsers = new Map();
  io.onlineUsers = onlineUsers;

  // Handle socket connections
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // Register user to track sockets
    socket.on("registerUser", (userId, username) => {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ Registered user ${username} ${userId}`);
    });

    // Listen for notification events
    socket.on("sendNotification", (data) => {
      console.log("🟢 Incoming sendNotification event:", data);
      const recipientSocket = onlineUsers.get(data.recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit("getNotification", data);
        console.log(`📨 Sent notification to user ${data.recipientId}`);
      } else {
        console.log(`⚠️ User ${data.recipientId} not connected`);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      for (let [key, value] of onlineUsers.entries()) {
        if (value === socket.id) {
          onlineUsers.delete(key);
          break;
        }
      }
    });
  });

  // Make io available globally
  app.set("io", io);

  // Start server
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

// Mongo error logs
mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log",
  );
});
