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

socket.on('new-user', (name) => {
  const JOIN = true;
  addUserStatusToChat(name, JOIN);
  addUserToParticipants(name, false);
});

socket.on('user-disconnect', (name) => {
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
    height: '722',
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
    case LOAD:
      const ytPlayer = document.getElementById('player');
      ytPlayer.style.pointerEvents = 'auto';
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
    const searchBarText = e.target.value;
    // YouTube URL in the search bar
    if (!searchBarText.startsWith('https')) {
      return socket.emit('yt-search', searchBarText);
    }
    playVideoByUrl(searchBarText);
  }
});

function playVideoByUrl(videoUrl) {
  const url = new URL(videoUrl);
  userPause = false; // Edge Case: When a new video is loaded, it first pauses (2), causing unncessary events to fire; this boolean prevents 'pause' from being emitted by the video load
  preventPlay = true; // When the other users load the video, they will automatically play
  preventPause = true; // So it's not required to emit a play/pause event
  socket.emit('calibrate', room);
  socket.emit('video-info', url.href, room);
  // Loads a new video, with the video id extracted from the query params
  player.loadVideoById(url.searchParams.get('v'), 0, 'large');
  setTimeout(() => socket.emit('new-video', url, room), 0); // Doesn't run synchronously at times, so slight delay necessary (changed delay from 1000 -> 0)
  userPause = true; // Edge case: The first video loaded does NOT pause as the first step, so this line reverts it
}

// Sends the new user the meta-info of the video currently playing in the room
socket.on('new-user-loaded', (newUser) => {
  const videoUrl = player.getVideoUrl();
  const elapsedTime = player.getCurrentTime();
  socket.emit('current-video', videoUrl, elapsedTime, newUser);
});

socket.on('video-info', (videoInfo) => {
  const videoTitle = document.getElementById('video-title');
  const videoDate = document.getElementById('video-date');
  videoTitle.textContent = videoInfo.title;
  videoDate.textContent = videoInfo.datePublished;
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

/* Search Results */

socket.on('yt-search', (searchQuery, searchResults) => {
  const previousQuery = document.getElementById('search-query-info');
  const previousResults = document.querySelector('.search-results');
  if (previousResults) {
    previousQuery.remove();
    previousResults.remove();
  }
  const allResults = document.createElement('div');
  // Displays the query that corresponds to the search results
  const searchQueryInfo = createSearchQueryInfo(searchQuery);
  allResults.classList.add('search-results');
  const column1 = document.querySelector('.col-1');
  column1.after(searchQueryInfo);
  // allResults.append(searchQueryInfo);
  searchResults.forEach((searchResult) => {
    const searchTitle = createSearchTitle(searchResult);
    const searchChannel = createSearchChannel(searchResult);
    // Meta information of the search result
    const searchItemInfo = createSearchInfo(searchTitle, searchChannel);
    // Thumbnail + Meta info + Hidden Link
    const searchItem = createSearchItem(searchResult, searchItemInfo);
    allResults.append(searchItem);
  });
  // Meta information of the current video playing
  const wrapper = document.querySelector('.wrapper');
  wrapper.append(allResults);
  searchQueryInfo.scrollIntoView({ behavior: 'smooth' });
});

// Each item in the grid of search results
function createSearchItem(searchResult, searchItemInfo) {
  const searchItem = document.createElement('div');
  const thumbnail = document.createElement('img');
  const videoLink = createVideoLink(searchResult);
  const player = document.getElementById('player');
  searchItem.classList.add('search-item');
  // Avoids black bars
  thumbnail.src = searchResult.thumbnails.medium.url;
  searchItem.append(thumbnail);
  searchItem.append(searchItemInfo);
  searchItem.append(videoLink);
  searchItem.onclick = () => {
    // The last child refers to the hidden video link
    playVideoByUrl(searchItem.lastElementChild.textContent);
    player.scrollIntoView({behavior:'smooth'});
  };
  return searchItem;
}

// Meta information for each search item
function createSearchInfo(searchTitle, searchChannel) {
  const searchItemInfo = document.createElement('div');
  searchItemInfo.classList.add('search-item-info');
  searchItemInfo.append(searchTitle);
  searchItemInfo.append(searchChannel);
  return searchItemInfo;
}

// Hidden video link that lets you load the video
function createVideoLink(searchResult) {
  const videoLink = document.createElement('p');
  videoLink.style.display = 'none';
  videoLink.textContent = searchResult.link;
  return videoLink;
}

// YouTube channel of the search item
function createSearchChannel(searchResult) {
  const searchChannel = document.createElement('span');
  searchChannel.id = 'channel';
  searchChannel.textContent = searchResult.channelTitle;
  return searchChannel;
}

// Video Title of the search item
function createSearchTitle(searchResult) {
  const searchTitle = document.createElement('span');
  searchTitle.id = 'search-title';
  searchTitle.textContent = searchResult.title;
  return searchTitle;
}

// The query that corresponds to the search results
function createSearchQueryInfo(searchQuery) {
  const searchQueryInfo = document.createElement('p');
  searchQueryInfo.id = 'search-query-info';
  searchQueryInfo.innerHTML = `Results For: <span id="search-query">${searchQuery}</span>`; // XSS!!
  return searchQueryInfo;
}

// YouTube Data Api has a daily quota of 10,000 queries
socket.on('api-quota-reached', () => {
  const previousResults = document.querySelector('.search-results');
  if (previousResults) {
    previousResults.remove();
  }
  const errorMessage = document.createElement('p');
  errorMessage.classList = 'api-error';
  errorMessage.textContent = 'YouTube search unavailable. Please use a video URL instead.';
  const column1 = document.querySelector('.col-1');
  column1.after(errorMessage);
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
function addMessage(user, message) {
  const messageElem = document.createElement('div');
  const msgTime = moment().format('h:mm a');
  messageElem.classList.add('chat-msg');
  messageElem.innerHTML = `<p class="meta">${user} <span>${msgTime}</span></p><p class="msg-text">${message}</p>`; // TODO: Fix XSS
  chatArea.append(messageElem);
}

/* Invite Friends */

const inviteBtn = document.getElementById('invite-btn');
const inviteModal = document.querySelector('.invite-modal');
const inviteLink = document.getElementById('invite-link');
const copyBtn = document.getElementById('copy');
const inviteShortcut = document.getElementById('invite-shortcut');
const html = document.querySelector('html');

// 'Invite Friends' button
inviteBtn.addEventListener('click', () => {
  inviteModal.classList.toggle('show-modal');
});

// Small copy button inside modal
copyBtn.addEventListener('click', (e) => {
  e.preventDefault();
  inviteLink.select();
  document.execCommand('copy');
  inviteLink.blur();
});

// Shortcut icon link button
inviteShortcut.onclick = (e) => {
  e.preventDefault();
  window.navigator.clipboard.writeText(`https://synctogether.tv/${room}`); // May not be supported by all browsers
};

html.addEventListener('click', (e) => {
  // Ignore clicks on the modal
  if (e.target.classList.contains('ignore-click')) {
    return;
  }
  if (inviteModal.classList.contains('show-modal')) {
    // Hide the modal when clicking outside
    inviteModal.classList.remove('show-modal');
  }
});

const playerElement = document.getElementById('player');
if (playerElement.tagName === 'DIV') {
  onYouTubeIframeAPIReady(); 
}
