var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var path    = require('path');

app.use(express.static(path.join(__dirname,"public")));

// 3000 포트 연결
var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log("server on!: http://localhost:3000/");
});

var SETTINGS = require("./pongOnline/SETTINGS.js");

var lobbyManager = new (require('./pongOnline/LobbyManager.js'))(io);
var roomManager = new (require('./pongOnline/RoomManager.js'))(io);
var gameManager = new (require('./pongOnline/GameManager.js'))(io, roomManager);

io.on('connection', function(socket){
  io.to(socket.id).emit('connected', SETTINGS.CLIENT_SETTINGS);
  console.log('user connected: ', socket.id);

  // 대기
  socket.on('waiting', function(){
    lobbyManager.push(socket);
    lobbyManager.dispatch(roomManager);
  });

  // 연결 끊기 방파괴
  socket.on('disconnect', function(){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.destroy(roomIndex);
    lobbyManager.kick(socket);
    console.log('user disconnected: ', socket.id);
  });

  // 키가 눌러지는 경우 유저 개체에 키값을 저장
  socket.on('keydown', function(keyCode){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.rooms[roomIndex].objects[socket.id].keypress[keyCode] = true;
  });

  // 준비
  socket.on('ready', function(){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.rooms[roomIndex].objects[socket.id].ready = true;
  });

  // 키가 눌러져 있지 않는 경우 해당 유저의 키값 삭제
  socket.on('keyup', function(keyCode){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) delete roomManager.rooms[roomIndex].objects[socket.id].keypress[keyCode];
  });

  // 마우스 이동
  socket.on('mousemove', function(x,y){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.rooms[roomIndex].objects[socket.id].mouse.move={x:x,y:y};
  });

  // 터치
  socket.on('click', function(x,y){
    var roomIndex = roomManager.roomIndex[socket.id];
    if(roomIndex) roomManager.rooms[roomIndex].objects[socket.id].mouse.click={x:x,y:y};
  });
});
