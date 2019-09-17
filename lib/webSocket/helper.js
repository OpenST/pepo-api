const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  NotificationUnreadFormatter = require(rootPrefix + '/lib/formatter/strategy/NotificationUnread'),
  HasUnreadNotifications = require(rootPrefix + '/app/services/user/notification/HasUnreadNotifications'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails');

let expiryExtentionTimeInMinutes = 1,
  allTasksDone = false;

class webSocketServerHelper {
  async onSocketConnection(userId, userSocketConnDetailsId, socket) {
    const oThis = this;

    let socketExtentionTime = oThis.getSocketExtentionTime();

    socket.userId = userId;
    socket.userSocketConnDetailsId = userSocketConnDetailsId;
    socket.socketExpiryAt = socketExtentionTime;

    webSocketCustomCache.setIntoSocketObjsMap(userSocketConnDetailsId, socket);
    webSocketCustomCache.setIntoUserSocketIdsMap(userId, userSocketConnDetailsId);
    webSocketCustomCache.setTimeToSocketIds(socketExtentionTime, userSocketConnDetailsId);

    let unreadNotificationsResp = await new HasUnreadNotifications({ user_id: userId }).perform();
    let formattedUnreadNotificationsResp = {};
    if (unreadNotificationsResp.isSuccess()) {
      formattedUnreadNotificationsResp = new NotificationUnreadFormatter(unreadNotificationsResp.data).perform();
    }
    socket.emit('pepo-stream', formattedUnreadNotificationsResp.data);

    logger.log('Authentication Successful for userId: ', userId);
    socket.emit('pepo-stream', 'Authentication Successful !!');
    logger.log('Emitted event for userId: ', userId);
  }

  async associateEvents(socket) {
    const oThis = this;

    socket.on('disconnect', async function() {
      logger.trace('Socket on-disconnect called. ');
      await oThis.onSocketDisconnect(socket);
    });

    socket.conn.on('packet', async function(packet) {
      if (packet.type === 'ping') {
        console.log('received ping');
        await oThis.onPingPacket(socket);
      }
    });
  }

  async onSocketDisconnect(socket) {
    let userSocketConnDetailsId = socket.userSocketConnDetailsId,
      userId = socket.userId;

    if (!userSocketConnDetailsId) {
      return true;
    }

    await new UserSocketConnectionDetailsModel()._markSocketConnectionDetailsAsExpired(
      [userSocketConnDetailsId],
      [userId]
    );

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
  async onPingPacket(socket) {
    const oThis = this;

    console.log('Received Ping==============for userSocketConnDetailsId - ', socket.userSocketConnDetailsId);

    let userSocketConnDetailsId = socket.userSocketConnDetailsId,
      currentTime = socket.socketExpiryAt,
      newTime = oThis.getSocketExtentionTime();

    if (currentTime < newTime) {
      socket.socketExpiryAt = newTime;
      webSocketCustomCache.deleteTimeToSocketIds(currentTime, userSocketConnDetailsId);
      webSocketCustomCache.setTimeToSocketIds(newTime, userSocketConnDetailsId);
    }
  }

  pendingTasksDone() {
    const oThis = this;

    if (webSocketCustomCache.checkStopConnectingSockets()) {
      return allTasksDone;
    } else {
      webSocketCustomCache.markStopConnectingSockets();
      oThis.completePendingTask().then(function() {
        allTasksDone = true;
      });
      return allTasksDone;
    }
  }

  async completePendingTask() {
    let socketConnDetailsIds = [],
      userIds = [];

    for (let socketId in webSocketCustomCache.socketObjsMap) {
      let socketObj = webSocketCustomCache.socketObjsMap[socketId];
      socketObj.emit('pepo-stream', 'Force Disconnecting !!');
      socketObj.disconnect();
    }

    console.log(
      '-------webSocketCustomCache.userSocketConnDetailsIdsMap-----',
      webSocketCustomCache.userSocketConnDetailsIdsMap
    );
    for (let userId in webSocketCustomCache.userSocketConnDetailsIdsMap) {
      userIds.push(userId);
      socketConnDetailsIds.concat(webSocketCustomCache.userSocketConnDetailsIdsMap[userId]);
    }

    console.log('-------socketConnDetailsIds-----', socketConnDetailsIds);
    if (socketConnDetailsIds.length > 0) {
      await new UserSocketConnectionDetailsModel()._markSocketConnectionDetailsAsExpired(socketConnDetailsIds, userIds);
    }

    return true;
  }

  getSocketExtentionTime() {
    return basicHelper.getCurrentTimestampInMinutes() + 2 * expiryExtentionTimeInMinutes;
  }
}

module.exports = new webSocketServerHelper();
