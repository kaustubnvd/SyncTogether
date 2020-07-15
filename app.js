const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const session = require('express-session');
const flash = require('connect-flash');
const ytScraper = require('yt-scraper');
const youtubeSearch = require('youtube-search');
require('dotenv').config();

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

app.use(
  session({ secret: 'sambar vadai', resave: false, saveUninitialized: false })
);

app.use(flash()); // Stores flash messages in the session

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

  // Gets the YouTube video info for a given video url
  async function fetchVideoInfo(videoUrl) {
    try {
      const videoInfo = await ytScraper.videoInfo(videoUrl);
      videoInfo.datePublished = moment(videoInfo.dates.published).format('ll');
      return videoInfo;
    } catch (err) {
      console.error(err);
    }
  }

  socket.on('video-info', async (videoUrl, room) => {
    const videoInfo = await fetchVideoInfo(videoUrl);
    io.in(room).emit('video-info', videoInfo);
  });

  // Send the new user the meta-data of the current video playing
  socket.on('current-video', async (videoUrl, elapsedTime, newUser) => {
    const videoId = new URL(videoUrl).searchParams.get('v');
    // No video is loaded
    if (!videoId) {
      return;
    }
    io.to(newUser).emit('current-video', videoUrl, elapsedTime);
    const videoInfo = await fetchVideoInfo(videoUrl);
    io.to(newUser).emit('video-info', videoInfo);
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

  socket.on('yt-search', search => {
    const options = {maxResults: 8, key: process.env.YOUTUBE_API_KEY};
    youtubeSearch(search, options, (err, results) => {
      if (err) {
        // 10,000 queries per day
        return socket.emit('api-quota-reached');
      }
      socket.emit('yt-search', search, results);
    });
  });

  // A user loads a new video in the room
  socket.on('new-video', (videoUrl, room) => {
    socket.to(room).broadcast.emit('new-video', videoUrl);
  });

  // A user sends a chat message
  socket.on('chat-message', (message, room) => {
    const nickname = rooms[room].users[socket.id]; // The socket.id maps to the username
    // const msgTime = moment().format('h:mm a'); // When the message was sent
    // Emits to all sockets in the room, including the sender
    io.in(room).emit('chat-message', {
      name: nickname,
      message: message,
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

  socket.on('error', () => console.log('error'));
});
