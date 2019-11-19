const rootPrefix = '../..',
  goToConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName');

module.exports = {
  [goToConstants.videoGotoKind]: {
    page: pageNameConstants.videoPageName,
    values: ['videoId']
  },
  [goToConstants.replyGotoKind]: {
    page: pageNameConstants.replyDetailPageName,
    values: ['replyDetailId']
  },
  [goToConstants.addEmailScreenGotoKind]: {
    page: pageNameConstants.addEmailScreen,
    values: []
  },
  [goToConstants.webViewGotoKind]: {
    page: pageNameConstants.webViewScreen,
    values: ['url']
  },
  [goToConstants.signUpGotoKind]: {
    page: pageNameConstants.signupScreen,
    values: ['inviteCode']
  },
  [goToConstants.invitedUsersGotoKind]: {
    page: pageNameConstants.invitedUsersListPage,
    values: []
  },
  [goToConstants.profileGotoKind]: {
    page: pageNameConstants.profilePageName,
    values: ['userId']
  },
  [goToConstants.notificationCentreGotoKind]: {
    page: pageNameConstants.notificationCentrePageName,
    values: []
  },
  [goToConstants.feedGotoKind]: {
    page: pageNameConstants.feedPageName,
    values: []
  },
  [goToConstants.contributedByGotoKind]: {
    page: pageNameConstants.contributedByPageName,
    values: ['userId']
  },
  [goToConstants.storeGotoKind]: {
    page: pageNameConstants.storePepoWebView,
    values: []
  },

  [goToConstants.supportGotoKind]: {
    page: pageNameConstants.supportWebView,
    values: []
  },

  [goToConstants.tagGotoKind]: {
    page: pageNameConstants.tagPage,
    values: ['tagId']
  }
};
