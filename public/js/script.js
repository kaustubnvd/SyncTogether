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