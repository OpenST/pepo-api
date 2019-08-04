const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const rootPrefix = '.';

const WebsocketAuth = require(rootPrefix + '/app/services/websocket/auth'),
  apiRoutes = require(rootPrefix + '/routes/api/index'),
  webhookRoutes = require(rootPrefix + '/routes/webhooks/index'),
  elbHealthCheckerRoute = require(rootPrefix + '/routes/internal/elb_health_checker');

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log('a user connected socket', socket.handshake.query);
  let params = socket.handshake.query,
    websocketAuthObj = new WebsocketAuth(params);

  websocketAuthObj
    .perform()
    .then(function(rsp) {
      if (rsp.isFailure()) {
        console.log('---Authentication Failed-----');
        io.emit('server-event', 'Authentication Failed !!');
        socket.close();
      } else {
        console.log('---Authentication Success-----');
        io.emit('server-event', 'Authentication Successful !!');
      }
    })
    .catch(function(err) {
      console.log('--err---', err);
    });
});

http.listen(4000, function() {
  console.log('listening on *:4000');
});
