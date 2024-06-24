const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_chat", ({ room, username }) => {
    if (!rooms[room]) {
      rooms[room] = [];
    }

    if (rooms[room].length < 2) {
      rooms[room].push({ id: socket.id, username });
      socket.join(room);
      console.log(`${username} joined room: ${room}`);
      socket.emit("joined_chat");

      if (rooms[room].length === 2) {
        const [user1, user2] = rooms[room];
        io.to(user1.id).emit("chat_started", { otherUser: user2.username });
        io.to(user2.id).emit("chat_started", { otherUser: user1.username });
      }
    } else {
      socket.emit("room_full", { message: "Room is full. Try another room." });
    }
  });

  socket.on("send_message", (data) => {
    const { room } = data;
    socket.to(room).emit("receive_message", data);
  });

  socket.on("delete_message", ({ room, messageId }) => {
    io.to(room).emit("receive_delete_message", messageId);
  });

  socket.on("disconnect", () => {
    let disconnectedUser = null;
    for (const room in rooms) {
      rooms[room] = rooms[room].filter(user => {
        if (user.id === socket.id) {
          disconnectedUser = user.username;
          return false;
        }
        return true;
      });

      if (rooms[room].length === 0) {
        delete rooms[room];
      } else if (disconnectedUser) {
        const remainingUser = rooms[room][0];
        io.to(remainingUser.id).emit("user_left", { otherUser: disconnectedUser });
      }
    }
    console.log("User Disconnected", socket.id);
  });

  socket.on("leave_room", ({ room }) => {
    socket.leave(room);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
