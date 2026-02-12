const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let participants = [];

io.on('connection', (socket) => {
    socket.on('join-room', (data) => {
        socket.join(data.roomId);
        socket.username = data.username;
        socket.role = data.role;
        socket.peerId = data.peerId;

        participants.push({ id: socket.id, username: data.username, role: data.role, peerId: data.peerId });
        
        // Notify the Host that a new student is ready for the stream
        socket.to(data.roomId).emit('user-connected', data.peerId);
        io.to(data.roomId).emit('update-users', participants);
    });

    socket.on('send-message', (data) => {
        io.to(data.roomId).emit('receive-message', { user: socket.username, text: data.message });
    });

    socket.on('host-ends-session', (roomId) => {
        if (socket.role === 'host') {
            io.to(roomId).emit('session-ended');
            participants = []; 
        }
    });

    socket.on('disconnect', () => {
        participants = participants.filter(p => p.id !== socket.id);
        io.emit('update-users', participants);
    });
});

server.listen(3000, () => console.log("Server running at http://localhost:3000"));