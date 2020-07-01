const rooms = require('../models/rooms');
let nickname; // Global variable to pass to next request

exports.createRoom = (req, res) => {

  // Not joining a pre-existing room
  if (!(req.body.isJoining === 'on')) {
    // Trying to create a room that already exists
    if (req.body.room in rooms) {
      return res.redirect('/');
    }
    // Create the room if the user isn't joining a pre-exisiting one
    rooms[req.body.room] = { users: {} };
  } 
  nickname = req.body.nickname;
  res.redirect(req.body.room);
};

exports.joinRoom = (req, res) => {
  const roomName = req.params.room;
  // Trying to join a room that doesn't exist
  if (!(roomName in rooms)) {
    return res.redirect('/');
  }
  res.render('room', { roomName: roomName, nickname: nickname });
  nickname = undefined; // So that next request doesn't use the previous name
};
