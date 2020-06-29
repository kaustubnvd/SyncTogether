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
