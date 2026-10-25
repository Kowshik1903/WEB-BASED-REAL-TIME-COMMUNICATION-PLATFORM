
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./models/message");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const clientOrigin =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: clientOrigin }));
// Data-URL media grows by roughly one third while travelling over JSON.
app.use(express.json({ limit: "12mb" }));

// Handle invalid JSON requests
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON. Please check your request body.",
    });
  }

  next(err);
});

app.get("/", (req, res) => {
  res.send("Chat Portal Backend is running!");
});

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/messages", require("./routes/messages"));

// Each socket is tied to a verified user. A room keeps multi-tab sessions online.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Authentication required"));
  }
});

const onlineCounts = new Map();
const emitOnlineUsers = () => io.emit("onlineUsers", [...onlineCounts.keys()]);

io.on("connection", (socket) => {
  const username = socket.user.username;
  socket.join(`user:${username}`);
  onlineCounts.set(username, (onlineCounts.get(username) || 0) + 1);
  emitOnlineUsers();

  // Kept as a no-op for older clients that still emit this event.
  socket.on("userOnline", () => {});

  socket.on("sendMessage", async (data) => {
    if (!data || data.sender !== username || !data.receiver || !data._id) return;
    try {
      const message = await Message.findOne({
        _id: data._id,
        sender: username,
        receiver: data.receiver,
      }).lean();
      if (!message) return;
      io.to(`user:${message.receiver}`).emit("receiveMessage", message);
      socket.emit("receiveMessage", message);
    } catch (err) {
      console.error("socket.message.error", err.message);
    }
  });

  socket.on("typing", ({ receiver } = {}) => {
    if (typeof receiver === "string" && receiver) {
      io.to(`user:${receiver}`).emit("typing", { sender: username });
    }
  });

  socket.on("disconnect", () => {
    const remaining = (onlineCounts.get(username) || 1) - 1;
    if (remaining > 0) onlineCounts.set(username, remaining);
    else onlineCounts.delete(username);
    emitOnlineUsers();
  });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error("MONGO_URI and JWT_SECRET must be set in BACKEND/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exitCode = 1;
  }
}

startServer();
