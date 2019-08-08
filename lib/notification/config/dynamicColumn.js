const rootPrefix = '../../..',
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  column1: {},
  column2: {},
  flag1: {
    [userNotificationConstants.videoTxSendSuccessKind]: 'thankYouFlag'
  },
  flag2: {}
};
