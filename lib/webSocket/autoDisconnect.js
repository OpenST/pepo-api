const rootPrefix = '../..',
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  basicHelper = require(rootPrefix + '/helpers/basic');

class AutoDisconnect {
  perform(timestamp) {
    const oThis = this;
    if (timestamp) {
      let socketIds = webSocketCustomCache.getTimeToSocketIds(timestamp);
      oThis.disconnectAllSockets(timestamp, socketIds);
    } else {
      for (let timestamp in webSocketCustomCache.timeToSocketIdsMap) {
        let socketIds = webSocketCustomCache.timeToSocketIdsMap[timestamp];
        if (socketIds.length > 0) {
          oThis.disconnectAllSockets(timestamp, socketIds);
        } else {
          webSocketCustomCache.deleteTimeToSocketIds(timestamp);
        }
      }
    }
    return true;
  }

  disconnectAllSockets(timestamp, socketIds) {
    if (timestamp >= basicHelper.getCurrentTimestampInMinutes()) {
      return true;
    }

    for (let i = 0; i < socketIds.length; i++) {
      let socketId = socketIds[i],
        socketObj = webSocketCustomCache.getFromSocketObjsMap(socketId);
      // Give 1 minute buffer before trigger disconnect
      if (socketObj && socketObj.socketExpiryAt < basicHelper.getCurrentTimestampInMinutes() - 1) {
        socketObj.disconnect();
        webSocketCustomCache.deleteTimeToSocketIds(timestamp, socketId);
      }
    }

    return true;
  }
}

module.exports = new AutoDisconnect();
