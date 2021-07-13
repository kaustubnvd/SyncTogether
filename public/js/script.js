
// Used in home.ejs
const joinCheckBox = document.getElementById('form-join');
const roomInput = document.querySelector('#room');
const formBtn = document.querySelector('.form-btn');

// eslint-disable-next-line no-unused-vars
joinCheckBox.addEventListener('click', (event) => {
  joinToggle(formBtn);
});

function joinToggle(button) {
  if (joinCheckBox.checked) {
    roomInput.placeholder = 'kpstudy, dlfbaiz, myawesomeroom, etc.';
    button.textContent = 'Join Room';
  } else {
    roomInput.placeholder = 'Help your friends find your room...';
    button.textContent = 'Create Room';
  }
}

// Prevent spaces and special chars as the name of the room (when typing, copy paste is still a possibility)
roomInput.addEventListener('keydown', (event) => {
  const patt = /^[a-zA-Z]+$/;
  if (!patt.test(roomInput.value)) {
    const txt = event.target.value.slice(0, -1).trim();
    roomInput.value = txt;
  }
});
