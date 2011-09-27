/*jslint devel: true, node: true, widget: true, maxerr: 50, indent: 4 */
/*global require, window, Circle*/

require.paths.unshift("/Users/sudarm/local/node/lib"); // because of some wired NPM issue. Should comment it out

var connect = require('connect'),
    sys = require('sys'),
    debug = true, // set to false in production
    log = function (message) {
        // wrapper for logging
        if (debug) {
            sys.puts(message);
        }
    },
    nicknames = [],
    currentLocation = 0,
    serialId = 0,
    app = connect.createServer()
        .use(connect.router(function (r) {
            r.get("/", function (req, resp) {

            });

            r.get("/moveleft", function (req, response) {
                var args = moveLeft(),
                    json = {name: 'move', args: args};            
                
                if (json) {
                    io.sockets.json.send(json);
                }
                
                response.end();
            });

            r.get("/moveright", function (req, response) {
                var args = moveRight(),
                    json = {name: 'move', args: args};

                if (json) {
                    io.sockets.json.send(json);            
                }
                
                response.end();
            });
        }))
        .use(connect.static(__dirname + '/public')),
    io = require('socket.io').listen(app);

app.listen(8080);

// socket handlers
io.sockets.on('connection', function (socket) {
    socket.on('get Id', function () {
        nicknames.push(serialId);

        socket.set('clientId', serialId, function () { 
            socket.emit('set Id', {clientId: serialId, currentClient: currentLocation}); 
            serialId += 1;
        });
    });

    // move left event
    socket.on('moveleft', function (data) {

        socket.get('clientId', function (err, clientId) {
            if (err) {
                log("Cannot retrieve client id: " + err);                
                return;
            }

            if (clientId !== currentLocation) {
                log("You are not the active client");
                return;
            }
            
            log("Received move left from: " + currentLocation);

            var json = moveLeft(socket);

            if (json) {
                socket.emit('move', json);                
                socket.broadcast.emit('move', json);            
            }

        });        
    });

    // move left event  
    socket.on('moveright', function (data) {
        socket.get('clientId', function (err, clientId) {
            if (err) {
                log("Cannot retrieve client id: " + err);                
                return;
            }

            if (clientId !== currentLocation) {
                log("You are not the active client");
                return;
            }
                    
            log("Received move right: " + currentLocation);            

            var json = moveRight(socket);

            if (json) {
                socket.emit('move', json);                                
                socket.broadcast.emit('move', json);            
            }
        });
    });

    // When the client disconnects
    socket.on('disconnect', function () {
        log("Received disconnect");
        
        socket.get('clientId', function (err, clientId) {
            if (err) {
                log("Cannot retrieve client id: " + err);                
                return;
            }
            
            log("Clientid: " + clientId);

            var idx = nicknames.indexOf(clientId); // Find the index
            if (idx !== -1) {
                nicknames.splice(idx, 1); // remove the client id
                log("Removed client id: " + clientId)
            }

            if (currentLocation === clientId) {
                resetActiveClient(socket);
            }                
        });        
    });    
});

// Reset Current client. this can happen if the current client disconnects
function resetActiveClient (socket) {
    log("Reactivate client");
    
    if (nicknames.length !== 0) {
        currentLocation = nicknames[0]; // pick the first client
        if (socket) {
            socket.broadcast.emit('currentClient', nicknames[0]);            
        }

    } else {
        // set currentLocaiton to the new client
        currentLocation = serialId;
    }        
}

function moveLeft(socket) {
    if (nicknames.length > 1) {
        // we have more than one client
        var idx = nicknames.indexOf(currentLocation), // Find the index
            to;

        if (idx !== -1) {
            if (idx === 0) {
                // move left of first client.
                to = nicknames.length - 1;
            } else {
                to = idx - 1;
            }

            currentLocation = nicknames[to];
            json = {
                from: nicknames[idx], 
                to: nicknames[to],
                direction: 'left'
            };
            
            log("from: " + idx + ", to: " + to);
            return json;

        } else {
            log("Invalid state. Current Client not found. ");
            resetActiveClient(socket);
            return;
        }            
    }            
}

function moveRight(socket) {
    if (nicknames.length > 1) {
        // we have more than one client
        var idx = nicknames.indexOf(currentLocation), // Find the index
            to,
            json;

        if (idx !== -1) {
            if (idx === (nicknames.length - 1)) {
                // move right of last client.
                to = 0;
            } else {
                to = idx + 1;
            }

            currentLocation = nicknames[to];
            json = {
                from: nicknames[idx], 
                to: nicknames[to],
                direction: 'right'
            };
            
            log("from: " + idx + ", to: " + to);
            return json;

        } else {
            log("Invalid state. Current Client not found. ");
            resetActiveClient(socket);
            return;
        }            
    }            
}    