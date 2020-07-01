// eslint-disable-next-line no-undef
const socket = io(); // Client controller

// eslint-disable-next-line no-undef
const name = nickname || prompt('Enter a nickname:'); // Ask for name if room is accessed through URL
// eslint-disable-next-line no-undef 
const room = roomName; // defined in room.ejs
socket.emit('new-user', name, room);

/* Chat */

const chatArea = document.querySelector('.chat-area');
const chatInput = document.getElementById('chat-input');

chatInput.addEventListener('keyup', (e) => {
  if(e.code === 'Enter') {
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

socket.on('chat-message', messageData => {
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
    events: {},
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

const search = document.getElementById('searchbar');
search.addEventListener('keyup', (e) => {
  if(e.code === 'Enter') {
    // YouTube URL in the search bar
    if (!e.target.value.startsWith('https')) {
      return;
    }
    const url = new URL(e.target.value);
    // Loads a new video, with the video id extracted from the query params
    player.loadVideoById(url.searchParams.get('v'), 0, 'large');
  }
});
