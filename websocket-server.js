const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  pingInterval: 30000, // how many ms before sending a new ping packet [30 seconds]
  pingTimeout: 60000 // how many ms without a pong packet to consider the connection closed [60 seconds]
});

const rootPrefix = '.',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  webSocketServerHelper = require(rootPrefix + '/lib/webSocket/helper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  processIdSelector = require(rootPrefix + '/lib/webSocket/processIdSelector'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
  socketJobProcessor = require(rootPrefix + '/executables/rabbitMqSubscribers/socketJobProcessor'),
  WebsocketAuth = require(rootPrefix + '/app/services/websocket/auth'),
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  websocketAutoDisconnect = require(rootPrefix + '/lib/webSocket/autoDisconnect');

const apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

let socketIdentifier = null;

async function run() {
  const websocketConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.websocket);

  if (websocketConfigResponse.isFailure()) {
    return websocketConfigResponse;
  }

  let websocketPort = websocketConfigResponse.data[configStrategyConstants.websocket].port;

  logger.step('-------------------------- Fetching cronProcessId --------------------------');
  let cronProcessId = await processIdSelector.perform();
  logger.step('-------------------------- Subscribing to RMQ -------- cronProcessId: ', cronProcessId);
  await subscribeToRmq(cronProcessId);
  logger.step('-------------------------- Starting Websocket server --------------------------');

  await startWebSocketServer(websocketPort);
}

async function startWebSocketServer(websocketPort) {
  // TODO - websocket - is following route needed?
  app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
  });

  io.on('connection', async function(socket) {
    console.log('a user connected socket', socket.handshake.query);
    let err = null;

    if (webSocketCustomCache.checkStopConnectingSockets()) {
      err = responseHelper.error({
        internal_error_identifier: 'ws_s_3',
        api_error_identifier: 'websocket_service_unavailable',
        debug_options: {}
      });
      socket.emit('pepo-stream', JSON.stringify(err));
      socket.disconnect();
      return true;
    }

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
      err = responseHelper.error({
        internal_error_identifier: 'ws_s_2',
        api_error_identifier: 'unauthorized_api_request',
        debug_options: { websocketAuthRsp: websocketAuthRsp }
      });
      socket.emit('pepo-stream', JSON.stringify(err));
      socket.disconnect();
      return true;
    }

    await webSocketServerHelper.onSocketConnection(
      websocketAuthRsp.data.userId,
      websocketAuthRsp.data.userSocketConnDetailsId,
      socket
    );
  });

  http.listen(websocketPort, function() {
    logger.step('**** Listening on port ' + websocketPort);
  });
}

async function subscribeToRmq(cronProcessId) {
  let socketJobProcessorObj = new socketJobProcessor({ cronProcessId: +cronProcessId });
  await socketJobProcessorObj.perform();
  socketIdentifier = socketConnectionConstants.getSocketIdentifierFromTopic(socketJobProcessorObj.topics[0]);
}

async function autoDisconnect() {
  console.log('\nautoDisconnect called========================TIME====', basicHelper.getCurrentTimestampInMinutes());
  websocketAutoDisconnect.perform();
  setTimeout(autoDisconnect, 60 * 1000);
}

run().catch(async function(err) {
  logger.error('Could not start websocket-server: ', err);

  let errorObject = responseHelper.error({
    internal_error_identifier: 'Could not start websocket-server',
    api_error_identifier: 'something_went_wrong',
    debug_options: { error: err.toString(), stack: err.stack },
    error_config: errorConfig
  });

  await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

  process.exit(1);
});
autoDisconnect();
