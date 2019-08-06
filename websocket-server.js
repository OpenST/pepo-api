const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const program = require('commander');

const rootPrefix = '.';

const WebsocketAuth = require(rootPrefix + '/app/services/websocket/auth'),
  socketJobProcessor = require(rootPrefix + '/executables/rabbitMqSubscribers/socketJobProcessor'),
  userSocketObjMap = {};

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node websocket-server.js --cronProcessId 5');
  logger.log('');
  logger.log('');
});

if (!program.cronProcessId) {
  program.help();
  process.exit(1);
}

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', async function(socket) {
  console.log('a user connected socket', socket.handshake.query);

  let params = socket.handshake.query,
    websocketAuthObj = new WebsocketAuth(params);

  let websocketAuthRsp = await websocketAuthObj.perform().catch(function(err) {
    console.log('--err---', err);
  });

  if (websocketAuthRsp.isFailure()) {
    console.log('---Authentication Failed-----');
    io.emit('server-event', 'Authentication Failed !!');
    socket.close();
    return;
  }

  let userId = websocketAuthRsp.data.userId;

  userSocketObjMap[userId] = userSocketObjMap[userId] || [];
  userSocketObjMap[userId].push(socket);

  socket.emit('server-event', 'Authentication Successful !!');
});

http.listen(4000, function() {
  console.log('listening on *:4000');
});

new socketJobProcessor({ cronProcessId: +program.cronProcessId, userSocketObjMap: userSocketObjMap }).perform();
