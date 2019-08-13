const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const rootPrefix = '.',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  processIdSelector = require(rootPrefix + '/lib/webSocket/processIdSelector'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
  socketJobProcessor = require(rootPrefix + '/executables/rabbitMqSubscribers/socketJobProcessor'),
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  WebsocketAuth = require(rootPrefix + '/app/services/websocket/auth'),
  websocketAutoDisconnect = require(rootPrefix + '/lib/webSocket/autoDisconnect'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails');

let socketIdentifier = null,
  cronProcessId = null,
  websocketPort = null,
  expiryExtentionTimeInMinutes = 1;

async function run() {
  const websocketConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.websocket);

  if (websocketConfigResponse.isFailure()) {
    return websocketConfigResponse;
  }

  websocketPort = websocketConfigResponse.data[configStrategyConstants.websocket].port;

  logger.step('-------------------------- Fetching cronProcessId --------------------------');
  cronProcessId = await processIdSelector.perform();
  logger.step(
    '-------------------------- Subscribing to RMQ -------------------------- cronProcessId: ',
    cronProcessId
  );
  await subscribeToRmq();
  logger.step('-------------------------- Starting Websocket server --------------------------');
  await startWebSocketServer();
}

async function startWebSocketServer() {
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
      logger.trace('Socket on-disconnect called. ');
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
      userSocketConnDetailsId = websocketAuthRsp.data.userSocketConnDetailsId,
      socketExtentionTime = getSocketExtentionTime();

    socket.userId = userId;
    socket.userSocketConnDetailsId = userSocketConnDetailsId;
    socket.socketExpiryAt = socketExtentionTime;

    webSocketCustomCache.setIntoSocketObjsMap(userSocketConnDetailsId, socket);
    webSocketCustomCache.setIntoUserSocketIdsMap(userId, userSocketConnDetailsId);
    webSocketCustomCache.setTimeToSocketIds(socketExtentionTime, userSocketConnDetailsId);

    logger.log('Authentication Successful for userId: ', userId);
    socket.emit('server-event', 'Authentication Successful !!');
    logger.log('Emitted event for userId: ', userId);
  });

  http.listen(websocketPort, function() {
    logger.step('**** Listening on port ' + websocketPort);
  });
}

async function onSocketDisconnect(socket) {
  let userSocketConnDetailsId = socket.userSocketConnDetailsId,
    userId = socket.userId;

  if (!userSocketConnDetailsId) {
    return true;
  }

  await new UserSocketConnectionDetailsModel()._markSocketConnectionDetailsAsExpired(userSocketConnDetailsId, userId);

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
  console.log('\nHERE==============');

  let userSocketConnDetailsId = socket.userSocketConnDetailsId,
    currentTime = socket.socketExpiryAt,
    newTime = getSocketExtentionTime();

  if (currentTime < newTime) {
    socket.socketExpiryAt = newTime;
    webSocketCustomCache.deleteTimeToSocketIds(currentTime, userSocketConnDetailsId);
    webSocketCustomCache.setTimeToSocketIds(newTime, userSocketConnDetailsId);
  }
}

async function subscribeToRmq() {
  let socketJobProcessorObj = new socketJobProcessor({ cronProcessId: +cronProcessId });
  await socketJobProcessorObj.perform();
  socketIdentifier = socketConnectionConstants.getSocketIdentifierFromTopic(socketJobProcessorObj.topics[0]);
}

function getSocketExtentionTime() {
  return basicHelper.getCurrentTimestampInMinutes() + 2 * expiryExtentionTimeInMinutes;
}

async function autoDisconnect() {
  console.log('\nautoDisconnect called========================TIME====', basicHelper.getCurrentTimestampInMinutes());
  websocketAutoDisconnect.perform();
  setTimeout(autoDisconnect, 60 * 1000);
}

run();
autoDisconnect();
