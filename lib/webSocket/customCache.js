const userSocketConnDetailsIdsMap = {},
  _socketIdToSocketObjMap = {},
  timeToUserSocketConnDetailsIdsMap = {};

/**
 * Class for web socket custom cache.
 *
 * @class WebSocketCustomCache
 */
class WebSocketCustomCache {
  /**
   * Constructor for web socket custom cache.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.stopConnectingSockets = false;
  }

  /**
   * Socket id socket obj map.
   */
  get socketIdToSocketObjMap() {
    return _socketIdToSocketObjMap;
  }

  get timeToUserSocketConnDetailsIdsMap() {
    return timeToUserSocketConnDetailsIdsMap;
  }

  get userSocketConnDetailsIdsMap() {
    return userSocketConnDetailsIdsMap;
  }

  getFromSocketIdToSocketObjMap(socketId) {
    const oThis = this;

    return oThis.socketIdToSocketObjMap[socketId];
  }

  deleteFromSocketIdToSocketObjMap(socketId) {
    const oThis = this;

    delete oThis.socketIdToSocketObjMap[socketId];

    return true;
  }

  setSocketIdToSocketObjMap(socketId, socketObj) {
    const oThis = this;

    oThis.socketIdToSocketObjMap[socketId] = socketObj;

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

    const userSocketConnDetails = oThis.userSocketConnDetailsIdsMap[userId];
    if (!userSocketConnDetails) {
      return true;
    }

    const userSocketConnDetailsIdIndex = userSocketConnDetails.indexOf(userSocketConnDetailsId);
    if (userSocketConnDetailsIdIndex >= 0) {
      oThis.userSocketConnDetailsIdsMap[userId].splice(userSocketConnDetailsIdIndex, 1);
    }

    return true;
  }

  getTimeToSocketIds(timestamp) {
    const oThis = this;

    return oThis.timeToUserSocketConnDetailsIdsMap[timestamp] || [];
  }

  setTimeToSocketIds(timestamp, socketId) {
    const oThis = this;
    oThis.timeToUserSocketConnDetailsIdsMap[timestamp] = oThis.timeToUserSocketConnDetailsIdsMap[timestamp] || [];
    oThis.timeToUserSocketConnDetailsIdsMap[timestamp].push(socketId);

    return oThis.timeToUserSocketConnDetailsIdsMap[timestamp];
  }

  deleteTimeToSocketIds(timestamp, socketId) {
    const oThis = this;

    if (oThis.timeToUserSocketConnDetailsIdsMap[timestamp] && socketId) {
      const userSocketConnDetailsIdIndex = oThis.timeToUserSocketConnDetailsIdsMap[timestamp].indexOf(socketId);
      if (userSocketConnDetailsIdIndex >= 0) {
        oThis.timeToUserSocketConnDetailsIdsMap[timestamp].splice(userSocketConnDetailsIdIndex, 1);
      }
    } else {
      delete oThis.timeToUserSocketConnDetailsIdsMap[timestamp];
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

module.exports = new WebSocketCustomCache();
