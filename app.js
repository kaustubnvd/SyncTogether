const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app); // Need the server for socket-io
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(require('./routes/home'));
app.use(require('./routes/room'));

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

const rooms = require('./models/rooms');

// eslint-disable-next-line no-unused-vars
io.on('connection', (socket) => {
  // A user has joined a new room
  socket.on('new-user', (name, room) => {
    socket.join(room);
    // Map their socket id to their nickname
    rooms[room].users[socket.id] = name;
    socket.to(room).broadcast.emit('new-user', name);
  });

  // A new user's YouTube player has loaded
  socket.on('loaded', (room) => {
    const participant = Object.keys(rooms[room].users)[0]; // Gets a user
    io.to(participant).emit('new-user-loaded', socket.id);
  });

  // Send the new user the meta-data of the current video playing
  socket.on('current-video', (videoUrl, elapsedTime, newUser) => {
    io.to(newUser).emit('current-video', videoUrl, elapsedTime);
  });

  // A user resumes the video
  socket.on('resume', (elapsedTime, room) => {
    socket.to(room).broadcast.emit('resume', elapsedTime);
  });

  // A user pauses the video
  socket.on('pause', (room) => {
    socket.to(room).broadcast.emit('pause');
  });

  // Prevents unnecessary events from firing
  socket.on('calibrate', (room) => {
    socket.to(room).broadcast.emit('calibrate');
  });

  // A user loads a new video in the room
  socket.on('new-video', (videoUrl, room) => {
    socket.to(room).broadcast.emit('new-video', videoUrl);
  });

  // A user sends a chat message
  socket.on('chat-message', (message, room) => {
    const nickname = rooms[room].users[socket.id]; // The socket.id maps to the username
    const msgTime = moment().format('h:mm a'); // When the message was sent
    // Emits to all sockets in the room, including the sender
    io.in(room).emit('chat-message', {
      name: nickname,
      message: message,
      time: msgTime,
    });
  });

  socket.on('disconnect', () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const room = Object.entries(rooms).find(([roomName, room]) => {
        // Can the same socket be in multiple rooms?
        return socket.id in room.users;
      })[0]; // First element in the array is the roomName
      const name = rooms[room].users[socket.id];
      socket.to(room).broadcast.emit('user-disconnect', name);
      delete rooms[room].users[socket.id];
      // Everyone in the room left
      if (Object.values(rooms[room].users).length === 0) {
        delete rooms[room];
      }
    } catch (err) {
      console.error(err);
    }
  });

});


