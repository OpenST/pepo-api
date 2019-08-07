const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const program = require('commander');

const rootPrefix = '.',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
  socketJobProcessor = require(rootPrefix + '/executables/rabbitMqSubscribers/socketJobProcessor'),
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  WebsocketAuth = require(rootPrefix + '/app/services/websocket/auth'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails');

let socketIdentifier = null;

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
  params.socketIdentifier = socketIdentifier;

  let websocketAuthRsp = await new WebsocketAuth(params).perform().catch(function(err) {
    return responseHelper.error({
      internal_error_identifier: 'ws_s_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: { error: err }
    });
  });

  socket.on('disconnect', async function() {
    await onSocketDisconnect(socket);
  });

  socket.conn.on('packet', async function(packet) {
    if (packet.type === 'ping') {
      console.log('received ping');
      await onPingPacket(socket);
    }
  });

  if (websocketAuthRsp.isFailure()) {
    socket.emit('server-event', 'Authentication Failed !!');
    socket.disconnect();
    return responseHelper.error({
      internal_error_identifier: 'ws_s_2',
      api_error_identifier: 'something_went_wrong',
      debug_options: { websocketAuthRsp: websocketAuthRsp }
    });
  }

  let userId = websocketAuthRsp.data.userId,
    userSocketConnDetailsId = websocketAuthRsp.data.userSocketConnDetailsId;

  socket.userId = userId;
  socket.userSocketConnDetailsId = userSocketConnDetailsId;

  console.log('------------------userId---userSocketConnDetailsId------', userId, userSocketConnDetailsId);
  webSocketCustomCache.setIntoSocketObjsMap(userSocketConnDetailsId, socket);
  webSocketCustomCache.setIntoUserSocketIdsMap(userId, userSocketConnDetailsId);

  socket.emit('server-event', 'Authentication Successful !!');
});

http.listen(4000, function() {
  console.log('listening on *:4000\n');
});

async function onSocketDisconnect(socket) {
  let userSocketConnDetailsId = socket.userSocketConnDetailsId,
    userId = socket.userId;

  if (!userSocketConnDetailsId) {
    return true;
  }

  await new UserSocketConnectionDetailsModel()
    .update({
      status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.expiredStatus]
    })
    .where({
      id: userSocketConnDetailsId
    })
    .fire();

  await UserSocketConnectionDetailsModel.flushCache({ userId: userId });

  webSocketCustomCache.deleteFromSocketObjsMap(userSocketConnDetailsId);

  webSocketCustomCache.deleteFromUserSocketIdsMap(userId, userSocketConnDetailsId);

  return true;
}

/**
 * updates expiry at every new ping packet.
 *
 * @param socket
 * @returns {Promise<void>}
 */
async function onPingPacket(socket) {
  let incrementInterval = 60,
    updateResponse = await new UserSocketConnectionDetailsModel()
      .update(['socket_expiry_at = socket_expiry_at + ?', incrementInterval])
      .where({
        id: socket.userSocketConnDetailsId,
        status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.connectedStatus]
      })
      .where(['socket_expiry_at > ?', basicHelper.getCurrentTimestampInSeconds()])
      .fire();

  console.log('--updateResponse--', updateResponse);

  //if nothing is updated then mark the socket as expired and call disconnect.
  if (updateResponse.changedRows === 0) {
    socket.disconnect();
  }

  await UserSocketConnectionDetailsModel.flushCache({ userId: socket.userId });
}

async function subscribeToRmq() {
  let socketObj = new socketJobProcessor({ cronProcessId: +program.cronProcessId });
  await socketObj.perform();
  socketIdentifier = socketConnectionConstants.getSocketIdentifierFromTopic(socketObj.topics[0]);
  console.log('---------socketObj.topics----=======', socketIdentifier);
}
subscribeToRmq();
