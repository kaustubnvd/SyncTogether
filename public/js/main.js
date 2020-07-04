// eslint-disable-next-line no-undef
const socket = io(); // Client controller

// eslint-disable-next-line no-undef
const name = nickname || prompt('Enter a nickname:') || backup; // Ask for name if room is accessed through URL

addUserToParticipants(name, true); // Add current user

// Add a newly joined user to participants
function addUserToParticipants(user, self) {
  const userElement = document.createElement('div');
  const icon = document.createElement('i');
  const iconName = self ? 'account_circle' : 'person';
  const iconText = document.createTextNode(iconName);
  icon.className = 'material-icons';
  icon.append(iconText);
  userElement.textContent = user;
  userElement.id = user;
  userElement.classList.add('user');
  if (self) {
    userElement.classList.add('self-highlight');
  }
  userElement.prepend(icon);
  const participants = document.querySelector('.participant-box');
  participants.append(userElement);
}

// eslint-disable-next-line no-undef
const room = roomName; // defined in room.ejs
socket.emit('new-user', name, room);

const chatArea = document.querySelector('.chat-area');

socket.on('new-user', name => {
  const JOIN = true;
  addUserStatusToChat(name, JOIN);
  addUserToParticipants(name, false);
});

socket.on('user-disconnect', name => {
  const LEAVE = false;
  addUserStatusToChat(name, LEAVE);
  removeUserFromParticipants(name);
});

// Add user join/leave status (with arrow icon) to the chat
function addUserStatusToChat(name, join) {
  const userStatus = document.createElement('div');
  const icon = document.createElement('i');
  const iconText = document.createTextNode('arrow_right_alt');
  icon.append(iconText);
  if (join) {
    icon.className = 'material-icons join-icon'; // Blue arrow
    userStatus.textContent = `${name} has joined the room`;
  } else {
    icon.className = 'material-icons leave-icon'; // Red arrow
    userStatus.textContent = `${name} has left the room`;
  }
  userStatus.classList.add('status-msg');
  userStatus.prepend(icon);
  chatArea.append(userStatus);
}

function removeUserFromParticipants(name) {
  const user = document.getElementById(name);
  user.remove();
}

/* YouTube player */

/* eslint-disable no-unused-vars */
let player;
// Called once API code has donwloaded
function onYouTubeIframeAPIReady() {
  // eslint-disable-next-line no-undef
  player = new YT.Player('player', {
    height: '719',
    width: '1283',
    videoId: '',
    events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange },
  });
}

function onPlayerReady(event) {
  socket.emit('loaded', room);
}

function onPlayerStateChange(event) {
  controlVideo(event.data);
}

// Bugs: Occasional desync issues, pausing/loading a video issues, seeking causes slight jitter
// Note: Pausing the video seems to sync better than seeking
// Test: Simultaneous requests and long-distance delay

// When certain socket events are handled, they inadvertently fire the YouTube player's 'onStateChange' events;
// The following booleans are scattered throughout the code to prevent unnecessary re-emitting of events
let preventPlay = false; 
let preventPause = false;
let preventReseek = false;

const PLAY = 1;
const LOAD = -1;
const PAUSE = 2;
const BUFFER = 3;

/* Events (some still re-emit)
   First user (host) loaded video: -1 3 1
   New video load: 2 -1 3 1 
*/

/* eslint-disable */

// Reacts to YouTube player state changes
function controlVideo(playerState) {
  switch (playerState) {
    case PLAY:
      if (!preventPlay) {
        socket.emit('resume', player.getCurrentTime(), room);
      }
      // Reset values for next request
      preventPause = false;
      preventPlay = false;
      break;
    case PAUSE:
      if (!preventPause) {
        socket.emit('pause', room);
      }
      // Reset values
      preventPause = false;
      if (!preventReseek) {
        preventPlay = false;
      }
      break;
    case BUFFER:
     preventReseek = true; // Seeking involves pause -> buffer -> play; the play event induced from seeking shouldn't refire
     break;
  }
}
/* eslint-enable */

let userPause = true;
const search = document.getElementById('searchbar');
search.addEventListener('keyup', (e) => {
  if (e.code === 'Enter') {
    // YouTube URL in the search bar
    if (!e.target.value.startsWith('https')) {
      return;
    }
    const url = new URL(e.target.value);
    userPause = false; // Edge Case: When a new video is loaded, it first pauses (2), causing unncessary events to fire; this boolean prevents 'pause' from being emitted by the video load
    preventPlay = true; // When the other users load the video, they will automatically play
    preventPause = true;  // So it's not required to emit a play/pause event
    socket.emit('calibrate', room);
    // Loads a new video, with the video id extracted from the query params
    player.loadVideoById(url.searchParams.get('v'), 0, 'large');
    setTimeout(() => socket.emit('new-video', url, room), 0); // Doesn't run synchronously at times, so slight delay necessary (changed delay from 1000 -> 0)
    userPause = true; // Edge case: The first video loaded does NOT pause as the first step, so this line reverts it
  }
});

// Sends the new user the meta-info of the video currently playing in the room
socket.on('new-user-loaded', (newUser) => {
  const videoUrl = player.getVideoUrl();
  const elapsedTime = player.getCurrentTime();
  socket.emit('current-video', videoUrl, elapsedTime, newUser);
});

// A new users loads the currently playing video in the room
socket.on('current-video', (videoUrl, elapsedTime) => {
  preventPlay = true;
  const url = new URL(videoUrl);
  player.loadVideoById(url.searchParams.get('v'), elapsedTime, 'large');
  setTimeout(() => socket.emit('resume', elapsedTime, room), 1000); // Waits for new user's video to load before resuming
});

// A user resumed playback
socket.on('resume', (elapsedTime) => {
  preventPlay = true; // Prevent re-emit
  player.seekTo(elapsedTime);
  player.playVideo();
});

// A user paused the video
socket.on('pause', () => {
  preventPause = true; // Prevent re-emit
  if (userPause) {
    player.pauseVideo();
  }
  userPause = true;
});

// Prevents the 'pause' event from firing on a new video laod
socket.on('calibrate', () => {
  userPause = false;
  preventPause = true;
});

// A user loaded a new video in the room
socket.on('new-video', (videoUrl) => {

  // Prevent re-emit
  preventReseek = true;
  preventPlay = true; 
  preventPause = true;

  const url = new URL(videoUrl);
  player.loadVideoById(url.searchParams.get('v'), 0, 'large');
  userPause = true;

});

/* Chat */

const chatInput = document.getElementById('chat-input');

chatInput.addEventListener('keyup', (e) => {
  if (e.code === 'Enter') {
    const message = e.target.value;
    // Prevent empty messages
    if (message === '') {
      return;
    }
    socket.emit('chat-message', message, room);
    e.target.value = ''; // Clear user input
    // Scrolls down
    chatArea.scrollTop = chatArea.scrollHeight;
  }
});

socket.on('chat-message', (messageData) => {
  addMessage(messageData.name, messageData.message, messageData.time);
  // Scrolls down on new message
  chatArea.scrollTop = chatArea.scrollHeight;
});

// Creates chat message and adds it to the DOM
function addMessage(user, message, time) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('chat-msg');
  messageElem.innerHTML = `<p class="meta">${user} <span>${time}</span></p><p class="msg-text">${message}</p>`; // TODO: Fix XSS
  chatArea.append(messageElem);
}
