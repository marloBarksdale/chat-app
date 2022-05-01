const socket = io();

const r = document.createElement('div');
document.body.appendChild(r);

const form = document.querySelector('#chatForm');
const submitButton = document.querySelector('.btn');
const chatBox = document.querySelector('#chat');
const locationButton = document.querySelector('#sendLocation');
const messages = document.querySelector('#messages');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Option
// Qs.parse(location.search)
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const $newMessage = messages.lastElementChild;

  const newMessageStyle = getComputedStyle($newMessage);

  const margin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + margin;

  const visibleHeight = messages.offsetHeight;

  const containerHeight = messages.scrollHeight;

  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }

  console.log(margin);
};

socket.on('locationMessage', ({ text, createdAt, username }) => {
  const html = Mustache.render(locationTemplate, {
    username,
    text,
    createdAt: moment(createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('message', ({ text, createdAt, username }) => {
  console.log(text);
  const html = Mustache.render(messageTemplate, {
    username,
    text,
    createdAt: moment(createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });

  document.querySelector('#sidebar').innerHTML = html;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = chatBox.value;
  //   chatBox.textContent = '';

  if (message.length === 0) {
    return;
  }

  submitButton.setAttribute('disabled', 'disabled');

  socket.emit('chat', message, (error) => {
    submitButton.removeAttribute('disabled');
    chatBox.value = '';
    chatBox.focus();

    if (error) {
      return console.log(error);
    }

    console.log('Message delivered');
  });
});

locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser');
  }

  locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((pos) => {
    socket.emit(
      'location',
      {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      },
      () => {
        locationButton.removeAttribute('disabled');
        console.log('Location shared');
      },
    );
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

// socket.on('countUpdated', (count) => {
//   r.textContent = count;
//   console.log('Count updated', count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
//   console.log('Clicked');

//   socket.emit('increment');
// });
