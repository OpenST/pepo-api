class webSocketCustomCache {
  constructor() {
    const oThis = this;
    oThis.socketObjsMap = {};
    oThis.userSocketIdsMap = {};
    oThis.timeToSocketIdsMap = {};
  }

  getFromSocketObjsMap(socketId) {
    const oThis = this;
    return oThis.socketObjsMap[socketId];
  }

  deleteFromSocketObjsMap(socketId) {
    const oThis = this;
    delete oThis.socketObjsMap[socketId];
    return true;
  }

  setIntoSocketObjsMap(socketId, socketObj) {
    const oThis = this;
    oThis.socketObjsMap[socketId] = socketObj;
    return true;
  }

  getFromUserSocketIdsMap(userId) {
    const oThis = this;
    return oThis.userSocketIdsMap[userId];
  }

  setIntoUserSocketIdsMap(userId, userSocketConnDetailsId) {
    const oThis = this;
    oThis.userSocketIdsMap[userId] = oThis.userSocketIdsMap[userId] || [];
    oThis.userSocketIdsMap[userId].push(userSocketConnDetailsId);
    return true;
  }

  deleteFromUserSocketIdsMap(userId, userSocketConnDetailsId) {
    const oThis = this;
    let userSocketConnDetails = oThis.userSocketIdsMap[userId];
    if (!userSocketConnDetails) {
      return true;
    }

    let userSocketConnDetailsIdIndex = userSocketConnDetails.indexOf(userSocketConnDetailsId);
    if (userSocketConnDetailsIdIndex >= 0) {
      oThis.userSocketIdsMap[userId].splice(userSocketConnDetailsIdIndex, 1);
    }
    return true;
  }

  getTimeToSocketIds(timestamp) {
    const oThis = this;
    return oThis.timeToSocketIdsMap[timestamp] || [];
  }

  setTimeToSocketIds(timestamp, socketId) {
    const oThis = this;
    oThis.timeToSocketIdsMap[timestamp] = oThis.timeToSocketIdsMap[timestamp] || [];
    oThis.timeToSocketIdsMap[timestamp].push(socketId);
    console.log('oThis.timeToSocketIdsMap ===------------------------------==', oThis.timeToSocketIdsMap);
    return oThis.timeToSocketIdsMap[timestamp];
  }

  deleteTimeToSocketIds(timestamp, socketId) {
    const oThis = this;

    if (oThis.timeToSocketIdsMap[timestamp] && socketId) {
      let userSocketConnDetailsIdIndex = oThis.timeToSocketIdsMap[timestamp].indexOf(socketId);
      if (userSocketConnDetailsIdIndex >= 0) {
        oThis.timeToSocketIdsMap[timestamp].splice(userSocketConnDetailsIdIndex, 1);
      }
    } else {
      delete oThis.timeToSocketIdsMap[timestamp];
    }
    return true;
  }
}

module.exports = new webSocketCustomCache();
