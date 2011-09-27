/*jslint browser: true, widget: true, windows: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true*/
/*global YUI, io, window, console*/

// Create a new YUI instance and populate it with the required modules.
YUI({

}).use('node', function (Y) {
    var socket = io.connect(),
        clientId,
        c = document.getElementById("myCanvas"), 
        cxt = c.getContext("2d"),
        width = window.innerWidth,
        height = window.innerHeight,
        ball;

    /**
     * Calculate the current position of the ball
     */
    function calculatePosition(data) {
        var from = data.from,
            to = data.to,
            log = Y.one('#log');

        log.set('innerHTML', 'Success');        

        if (clientId === from) {
            if (data.direction === 'left') {
                log.set('innerHTML', 'go Left');
                ball.goLeft();                
            } else {
                log.set('innerHTML', 'go right');
                ball.goRight();                                
            }
        }

        if (clientId === to) {
            if (data.direction === 'left') {
                log.set('innerHTML', 'came from right');
                ball.comeFromRight();
            } else {
                log.set('innerHTML', 'came from left');
                ball.comeFromLeft();
            }            
        }       
    }

    // Circle Class	
    function Circle(x, y, r, g) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;
        this.dx = 20;

        this.draw = function () {
            this.g.beginPath();
            this.g.fillStyle = "#FF0000";
            this.g.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
            this.g.closePath();
            this.g.fill();
        };

        this.getX = function () {
            return x;
        };

        this.getY = function () {
            return this.y;
        };

        this.center = function () {
            this.x = window.innerWidth / 2;
            this.y = window.innerHeight / 2;
        };
        
        this.goLeft = function () {     
            var fn = Y.later(10, this, function () {
                this.clear();
                this.x = this.x - this.dx;          
                this.draw();
                
                if (this.x < 0) {
                    this.clear();
                    fn.cancel();
                }
            }, {}, true);
        };

        this.goRight = function () {     
            var fn = Y.later(10, this, function () {
                this.clear();
                this.x = this.x + this.dx;
                this.draw();
                
                if (this.x > window.innerWidth) {
                    this.clear();
                    fn.cancel();
                }
            }, {}, true);
        };

        this.comeFromLeft = function () {
            Y.later(500, this, function () {
                this.x = 0;            
                this.draw();

                var fn = Y.later(10, this, function () {

                    this.clear();
                    this.x = this.x + this.dx;          
                    this.draw();
                    
                    if (this.x > (window.innerWidth / 2)) {
                        this.draw();
                        fn.cancel();
                    }
                }, {}, true);                
            });
        };

        this.comeFromRight = function () {
            Y.later(500, this, function () {

                this.x = window.innerWidth;            
                this.draw();
                                
                var fn = Y.later(10, this, function () {

                    this.clear();
                    this.x = this.x - this.dx;          
                    this.draw();
                    
                    if (this.x < (window.innerWidth / 2)) {
                        this.draw();                    
                        fn.cancel();
                    }
                }, {}, true);
            });
        };

        this.clear = function () {
            this.g.fillStyle = "#fff";
            this.g.fillRect(0, 0, window.innerWidth, window.innerHeight);
        };
    }

    // actual code starts
    
    // set the width and height of the canvas
    c.width = width;
    c.height = height;
    
    ball = new Circle(width / 2, height / 2, 50, cxt);    
    
    socket.on('connect', function (data) {
        console.log("Received connect");
        socket.emit('get Id');
    });

    socket.on('set Id', function (data) {
        clientId = data.clientId;
        console.log("received set id: " + data);
        Y.one('#log').set('innerHTML', 'Connected with clientid: ' + clientId);
        Y.one('#clientId').set('innerHTML', clientId);

        if (data.currentClient === clientId) {
            // we are the current client
            ball.center();
            ball.draw();                      
        }
    });

    socket.on('currentClient', function (newClientId) {
        if (newClientId === clientId) {
            // we are the current client
            ball.center();
            ball.draw();           
        }
    });

    socket.on('move', function (data) {
        console.log("Received move");
        console.log(data);
        calculatePosition(data);
    });
    
    socket.on('message', function (data) {
        console.log("Received message");
        if (data.name === 'move') {
            console.log(data.args);
            calculatePosition(data.args);
        }
    });

    Y.on('click', function () {
        socket.emit('moveleft');
    }, '#moveleft');

    Y.on('click', function () {
        socket.emit('moveright');
    }, '#moveright');

});