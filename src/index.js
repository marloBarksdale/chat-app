import http from 'http';
import { Server } from 'socket.io';
import express, { text } from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { addUser, getUser, removeUser, getUsersInRoom } from './utils/users.js';
import BadWordsFilter from 'bad-words';
import { generateMessage } from './utils/messages.js';

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

const myPath = path.join(__dirname, '../public');

app.use(express.static(myPath));

let message = 'Welcome to the Chat App';

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} has left the chat`),
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome'));
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} has joined!`),
      );
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on('chat', (message, callback) => {
    const filter = new BadWordsFilter();
    const user = getUser(socket.id);

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  });

  socket.on('location', ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);

    const maplink = `https://www.google.com/maps?q=${
      latitude + ',' + longitude
    }`;

    io.to(user.room).emit(
      'locationMessage',
      generateMessage(user.username, maplink),
    );
    callback();
  });
});

server.listen(port, () => {
  console.log('Server is up on 3000');
});
