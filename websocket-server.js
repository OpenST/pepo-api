const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const rootPrefix = '.',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  webSocketServerHelper = require(rootPrefix + '/lib/webSocket/server'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  processIdSelector = require(rootPrefix + '/lib/webSocket/processIdSelector'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
  socketJobProcessor = require(rootPrefix + '/executables/rabbitMqSubscribers/socketJobProcessor'),
  WebsocketAuth = require(rootPrefix + '/app/services/websocket/auth'),
  websocketAutoDisconnect = require(rootPrefix + '/lib/webSocket/autoDisconnect');

let socketIdentifier = null,
  cronProcessId = null;

async function run() {
  const websocketConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.websocket);

  if (websocketConfigResponse.isFailure()) {
    return websocketConfigResponse;
  }

  let websocketPort = websocketConfigResponse.data[configStrategyConstants.websocket].port;

  logger.step('-------------------------- Fetching cronProcessId --------------------------');
  cronProcessId = await processIdSelector.perform();
  logger.step('-------------------------- Subscribing to RMQ -------- cronProcessId: ', cronProcessId);
  await subscribeToRmq();
  logger.step('-------------------------- Starting Websocket server --------------------------');

  await startWebSocketServer(websocketPort);
}

async function startWebSocketServer(websocketPort) {
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

    await webSocketServerHelper.associateEvents(socket);

    if (websocketAuthRsp.isFailure()) {
      socket.emit('server-event', 'Authentication Failed !!');
      socket.disconnect();
      return responseHelper.error({
        internal_error_identifier: 'ws_s_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { websocketAuthRsp: websocketAuthRsp }
      });
    }

    webSocketServerHelper.onSocketConnection(
      websocketAuthRsp.data.userId,
      websocketAuthRsp.data.userSocketConnDetailsId,
      socket
    );
  });

  http.listen(websocketPort, function() {
    logger.step('**** Listening on port ' + websocketPort);
  });
}

async function subscribeToRmq() {
  let socketJobProcessorObj = new socketJobProcessor({ cronProcessId: +cronProcessId });
  await socketJobProcessorObj.perform();
  socketIdentifier = socketConnectionConstants.getSocketIdentifierFromTopic(socketJobProcessorObj.topics[0]);
}

async function autoDisconnect() {
  console.log('\nautoDisconnect called========================TIME====', basicHelper.getCurrentTimestampInMinutes());
  websocketAutoDisconnect.perform();
  setTimeout(autoDisconnect, 60 * 1000);
}

run();
autoDisconnect();
