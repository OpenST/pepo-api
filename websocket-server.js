const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const program = require('commander');

const rootPrefix = '.',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
  socketJobProcessor = require(rootPrefix + '/executables/rabbitMqSubscribers/socketJobProcessor'),
  WebsocketAuth = require(rootPrefix + '/app/services/websocket/auth'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails');

const userSocketIdsMap = {},
  socketObjsMap = {};

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

  let params = socket.handshake.query;
  params.socketServerIdentifier = program.cronProcessId;

  let websocketAuthRsp = await new WebsocketAuth(params).perform().catch(function(err) {
    console.log('--------err----------', err);
    return responseHelper.error({
      internal_error_identifier: 'ws_s_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: {}
    });
  });

  socket.on('disconnect', async function() {
    await onSocketDisconnect(socket);
  });

  if (websocketAuthRsp.isFailure()) {
    console.log('---Authentication Failed-----', websocketAuthRsp);
    socket.emit('server-event', 'Authentication Failed !!');
    socket.disconnect();
    return;
  }

  let userId = websocketAuthRsp.data.userId,
    userSocketConnDetailsId = websocketAuthRsp.data.userSocketConnDetailsId;

  socketObjsMap[userSocketConnDetailsId] = socket;

  userSocketIdsMap[userId] = userSocketIdsMap[userId] || [];
  userSocketIdsMap[userId].push(userSocketConnDetailsId);

  socket.userId = userId;
  socket.userSocketConnDetailsId = userSocketConnDetailsId;

  socket.emit('server-event', 'Authentication Successful !!');
});

http.listen(4000, function() {
  console.log('listening on *:4000');
});

async function onSocketDisconnect(socket) {
  console.log('--socketObj--------------userSocketConnDetailsId--', socket.userSocketConnDetailsId);
  console.log('--socketObj--------------userId--', socket.userId);

  const oThis = this;

  await new UserSocketConnectionDetailsModel()
    .update({
      status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.expiredStatus]
    })
    .where({
      user_id: socket.userSocketConnDetailsId
    })
    .fire();

  await UserSocketConnectionDetailsModel.flushCache({ userId: oThis.userId });
}

new socketJobProcessor({
  cronProcessId: +program.cronProcessId,
  userSocketIdsMap: userSocketIdsMap,
  socketObjsMap: socketObjsMap
}).perform();
