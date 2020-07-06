const rooms = require('../models/rooms');
const { uniqueNamesGenerator, starWars } = require('unique-names-generator');
let nickname; // Global variable to pass to next request
let backupNickname; // If the user doesn't enter a username, a randomly generated Star Wars character name is used as backup 

exports.createRoom = (req, res) => {

  // Not joining a pre-existing room
  if (!(req.body.isJoining === 'on')) {
    // Trying to create a room that already exists
    if (req.body.room in rooms) {
      req.flash('error', 'Someone is already using that room');
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
    req.flash('error', 'That room doesn\'t exist yet');
    return res.redirect('/');
  }
  backupNickname = uniqueNamesGenerator({dictionaries: [starWars], length: 1});
  res.render('room', { roomName: roomName, nickname: nickname, backup: backupNickname, users: rooms[roomName].users });
  nickname = undefined; // So that next request doesn't use the previous name
};
