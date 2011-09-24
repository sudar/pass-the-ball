require.paths.unshift("/Users/sudarm/local/node/lib");

var connect = require('connect')
  , app = connect.createServer()
  , io = require('socket.io').listen(app)
  , router = connect.router(handler),
  sys = require('sys');


var debug = true, // set to false in production
      log = function (message) {
          // wrapper for logging
          if (debug) {
              sys.puts(message);
          }
      };

app.use(router);
app.use(connect.static(__dirname + '/public'));
app.listen(8080);

function handler(r){
  r.get("/", function(req, resp){
    
  });
  
  r.get("/moveleft", function(req, response){
      if (currentLocation != 0) {
          io.sockets.json.send({from: currentLocation, to: currentLocation - 1});          
          currentLocation = currentLocation - 1;                      
        }
      response.end();
  });
  
  r.get("/moveright", function(req, response){
      if (currentLocation != 2) {
          io.sockets.json.send({from: currentLocation, to: currentLocation + 1});
          currentLocation = currentLocation + 1
        }
      response.end();
  });
}

var nicknames = {},
    currentLocation = 1;

io.sockets.on('connection', function (socket) {

    // move left event
  socket.on('moveleft', function (data) {
      log("Received move left from: " + currentLocation);      
      if (currentLocation != 0) {
          socket.broadcast.emit('move', {from: currentLocation, to: currentLocation - 1});
          currentLocation = currentLocation - 1;                
      }
  });
  
    // move left event  
  socket.on('moveright', function (data) {
          log("Received move right: " + currentLocation);            
      if (currentLocation != 2) {
          socket.broadcast.emit('move', {from: currentLocation, to: currentLocation + 1});
          currentLocation = currentLocation + 1;                
      }
  });
  
  socket.on('nickname', function (nick, fn) {
      log("Received nickname");
    if (nicknames[nick]) {
      fn(true);
    } else {
      fn(false);
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });

  socket.on('disconnect', function () {
      log("Received connect");      
      socket.broadcast.emit('connect');
  });
      
  socket.on('message', function () {
      log("Received message");
  });
      
  socket.on('disconnect', function () {
      log("Received disconnect");      
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
    
});