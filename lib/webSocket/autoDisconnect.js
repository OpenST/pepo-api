const rootPrefix = '../..',
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class AutoDisconnect {
  perform(timestamp) {
    const oThis = this;
    logger.log(
      'WebSocketCustomCache.timeToUserSocketConnDetailsIdsMap',
      webSocketCustomCache.timeToUserSocketConnDetailsIdsMap
    );
    if (timestamp) {
      let socketIds = webSocketCustomCache.getTimeToSocketIds(timestamp);
      oThis.disconnectAllSockets(timestamp, socketIds);
    } else {
      for (let timestamp in webSocketCustomCache.timeToUserSocketConnDetailsIdsMap) {
        let userSocketConnectionDetailsIds = webSocketCustomCache.timeToUserSocketConnDetailsIdsMap[timestamp];
        if (userSocketConnectionDetailsIds.length > 0) {
          oThis.disconnectAllSockets(timestamp, userSocketConnectionDetailsIds);
        } else {
          webSocketCustomCache.deleteTimeToSocketIds(timestamp);
        }
      }
    }
    return true;
  }

  disconnectAllSockets(timestamp, userSocketConnectionDetailsIds) {
    if (timestamp >= basicHelper.getCurrentTimestampInMinutes()) {
      return true;
    }

    for (let i = 0; i < userSocketConnectionDetailsIds.length; i++) {
      let socketId = userSocketConnectionDetailsIds[i],
        socketObj = webSocketCustomCache.getFromSocketIdToSocketObjMap(socketId);

      if (!socketObj) {
        webSocketCustomCache.deleteTimeToSocketIds(timestamp, socketId);
        continue;
      }

      // Give 1 minute buffer before trigger disconnect
      if (socketObj.socketExpiryAt < basicHelper.getCurrentTimestampInMinutes()) {
        logger.debug('\nDisconnect all sockets called');
        socketObj.emit('pepo-stream', 'Connection Expired. Disconnected !!');
        socketObj.disconnect();
        webSocketCustomCache.deleteTimeToSocketIds(timestamp, socketId);
      }
    }

    return true;
  }
}

module.exports = new AutoDisconnect();
