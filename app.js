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
app.use(bodyParser.urlencoded({extended: false}));

app.use(require('./routes/home'));
app.use(require('./routes/room'));

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

const rooms = require('./models/rooms');

// eslint-disable-next-line no-unused-vars
io.on('connection', socket => {

  socket.on('new-user', (name, room) => {
    socket.join(room);
    rooms[room].users[socket.id] = name;
  });

  socket.on('chat-message', (message, room) => {
    const nickname = rooms[room].users[socket.id]; // The socket.id maps to the username
    const msgTime = moment().format('h:mm a'); // When the message was sent 
    // Emits to all sockets in the room, including the sender
    io.in(room).emit('chat-message', {name: nickname, message: message, time: msgTime});
  });

}); 