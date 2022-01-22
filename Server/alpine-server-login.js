console.log("******** ALPINE SERVER ********");
console.log("PID: ", process.pid);

var CORE = require('./core.js');

const http = require('http');
const WebSocketServer = require('websocket').server;

/* server functions */
function launchServer(port) {
	var server = http.createServer( function(request, response) {
        console.log("[*] ",request.url);
        var data = CORE.onHTTPRequest(request, response);
        // if received data is false, dont do anything
        if (data === false)
            return;
        if (data != null)
            response.end(data);
        else
            response.end("");
    });
	server.listen(port, function() { console.log("Server ready!"); });

	var wsServer = new WebSocketServer( { httpServer: server } );
	wsServer.binaryType = 'arraybuffer';
	
    console.log("Port: ", port);
	
    wsServer.on('request', function(request) {
		/* get connection */
		var connection = request.accept(null, request.origin);

		/* new user connects */
		CORE.onUserConnect( connection );

		/* on message */
		connection.on('message', function(message) {
			if (message.type == "binary") {
				console.log("message binary: ", message);
			} else {
				CORE.onNewMessage(this, message);
			}
		});

		/* on disconnect */
		connection.on('close', function() {
			CORE.onUserDisconnect( connection );
		});
	});

}

/* server activity */
launchServer(9034);

CORE.init();