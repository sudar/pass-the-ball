// Create a new YUI instance and populate it with the required modules.
YUI({

}).use('node', function (Y) {

    var socket = io.connect(),
        id;
    
    socket.on('move', function (data) {
        console.log("Received move");
       calculatePosition(data);
    });
   
   socket.on('connect', function (data) {
        console.log("Received connect");
        Y.one('#log').set('innerHTML', 'connected');
   });
   
   socket.on('message', function (data) {
       calculatePosition(data);
   });
   
   Y.on('click', function () {
       socket.emit('moveleft');
       calculatePosition({from: id, to: id - 1});
   }, '#moveleft');
   
   Y.on('click', function () {
       socket.emit('moveright');
       calculatePosition({from: id, to: id + 1});       
   }, '#moveright');
   
   Y.on('click', function () {
       id = Y.one('#nickname').get('value');
       socket.emit('connect', id);
   }, '#connect');
   
   function calculatePosition(data) {
       var from = data.from,
        to = data.to,
        log = Y.one('#log');
        
        log.set('innerHTML', 'Success');        
        
        if (id == from) {
            if (from > to) {
                log.set('innerHTML', 'go Left');
            } else {
                log.set('innerHTML', 'go right');                
            }
        }
        
        if (id == to) {
            if (from > to) {
                log.set('innerHTML', 'came from right');
            } else {
                log.set('innerHTML', 'came from left');                
            }            
        }       
   }
   
});