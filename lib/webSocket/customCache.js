class webSocketCustomCache {
  constructor() {
    const oThis = this;
    oThis.socketObjsMap = {};
    oThis.userSocketIdsMap = {};
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
    console.log('userId ===------------==', userId);
    console.log('oThis.userSocketIdsMap ===------------==', oThis.userSocketIdsMap);

    console.log('oThis.userSocketIdsMap[userId] ===------------==', oThis.userSocketIdsMap[userId]);
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
}

module.exports = new webSocketCustomCache();
