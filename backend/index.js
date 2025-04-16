require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL , // Use env variable or fallback
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('Server is running');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a room
  socket.on('joinRoom', (roomID) => {
    console.log(`User ${socket.id} joined room: ${roomID}`);
    socket.join(roomID);
  });

  // Handle leaving a room
  socket.on('leaveRoom', (roomID) => {
    console.log(`User ${socket.id} left room: ${roomID}`);
    socket.leave(roomID);
  });

  // Receive transcript and broadcast it to others in the room
  socket.on('sendTranscript', (data) => {
    console.log(`Transcript received in room ${data.roomID}:`, data.transcript);
    io.to(data.roomID).emit('receiveTranscript', data); // Send transcript to everyone in the room
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server startup error:', err);
});