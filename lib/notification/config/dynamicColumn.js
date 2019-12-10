const rootPrefix = '../../..',
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

module.exports = {
  column1: {
    [userNotificationConstants.systemNotificationKind]: 'gotoParams'
  },
  column2: {},
  flag1: {
    [userNotificationConstants.videoTxReceiveSuccessKind]: 'thankYouFlag',
    [userNotificationConstants.profileTxReceiveSuccessKind]: 'thankYouFlag',
    [userNotificationConstants.replyTxReceiveSuccessKind]: 'thankYouFlag'
  },
  flag2: {}
};
