const path = require('path');
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const formatMessage = require('./utils/messages');
const { 
    userJoin, 
    getCurrentUser, 
    userLeave,
    getRoomUsers
} = require('./utils/users');

const botName = "ChatBot";

const app = express();
const server = http.createServer(app);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connect
const io = socketIo(server);
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        console.log(user);
        socket.join(user.room);

        socket.emit('event-message', formatMessage(botName, 'Welcome to my chatapp'));
        socket.broadcast
            .to(user.room)
            .emit('event-message', formatMessage(botName, `${user.username} has joined the chat`));

        io.to(user.room).emit('roomusers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'event-message', 
                formatMessage(botName, `${user.username} has left the chat`)
            );
            
            io.to(user.room).emit('roomusers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        
        io.to(user.room).emit('event-message', formatMessage(user.username, msg));
    });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

