let userSocketConnDetailsIdsMap = {},
  socketObjsMap = {},
  timeToSocketIdsMap = {};

class webSocketCustomCache {
  constructor() {
    const oThis = this;
    oThis.stopConnectingSockets = false;
  }

  get socketObjsMap() {
    return socketObjsMap;
  }

  get timeToSocketIdsMap() {
    return timeToSocketIdsMap;
  }

  get userSocketConnDetailsIdsMap() {
    return userSocketConnDetailsIdsMap;
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

  getFromUserSocketConnDetailsIdsMap(userId) {
    const oThis = this;
    return oThis.userSocketConnDetailsIdsMap[userId];
  }

  setIntoUserSocketIdsMap(userId, userSocketConnDetailsId) {
    const oThis = this;
    oThis.userSocketConnDetailsIdsMap[userId] = oThis.userSocketConnDetailsIdsMap[userId] || [];
    oThis.userSocketConnDetailsIdsMap[userId].push(userSocketConnDetailsId);
    return true;
  }

  deleteFromUserSocketIdsMap(userId, userSocketConnDetailsId) {
    const oThis = this;
    let userSocketConnDetails = oThis.userSocketConnDetailsIdsMap[userId];
    if (!userSocketConnDetails) {
      return true;
    }

    let userSocketConnDetailsIdIndex = userSocketConnDetails.indexOf(userSocketConnDetailsId);
    if (userSocketConnDetailsIdIndex >= 0) {
      oThis.userSocketConnDetailsIdsMap[userId].splice(userSocketConnDetailsIdIndex, 1);
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

  checkStopConnectingSockets() {
    const oThis = this;
    return oThis.stopConnectingSockets;
  }

  markStopConnectingSockets() {
    const oThis = this;
    oThis.stopConnectingSockets = true;
    return oThis.stopConnectingSockets;
  }
}

module.exports = new webSocketCustomCache();
