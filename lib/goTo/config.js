const rootPrefix = '../..',
  goToConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName');

module.exports = {
  [goToConstants.videoGotoKind]: {
    page: pageNameConstants.videoPageName,
    mandatoryValues: ['videoId'],
    optionalValues: []
  },
  [goToConstants.replyGotoKind]: {
    page: pageNameConstants.replyDetailPageName,
    mandatoryValues: ['replyDetailId', 'parentVideoId'],
    optionalValues: []
  },
  [goToConstants.addEmailScreenGotoKind]: {
    page: pageNameConstants.addEmailScreen,
    mandatoryValues: [],
    optionalValues: []
  },
  [goToConstants.webViewGotoKind]: {
    page: pageNameConstants.webViewScreen,
    mandatoryValues: ['url'],
    optionalValues: []
  },
  [goToConstants.signUpGotoKind]: {
    page: pageNameConstants.signupScreen,
    mandatoryValues: ['inviteCode'],
    optionalValues: []
  },
  [goToConstants.invitedUsersGotoKind]: {
    page: pageNameConstants.invitedUsersListPage,
    mandatoryValues: [],
    optionalValues: []
  },
  [goToConstants.profileGotoKind]: {
    page: pageNameConstants.profilePageName,
    mandatoryValues: ['userId'],
    optionalValues: [pageNameConstants.profileActionParam]
  },
  [goToConstants.notificationCentreGotoKind]: {
    page: pageNameConstants.notificationCentrePageName,
    mandatoryValues: [],
    optionalValues: []
  },
  [goToConstants.feedGotoKind]: {
    page: pageNameConstants.feedPageName,
    mandatoryValues: [],
    optionalValues: []
  },
  [goToConstants.contributedByGotoKind]: {
    page: pageNameConstants.contributedByPageName,
    mandatoryValues: ['userId'],
    optionalValues: []
  },
  [goToConstants.storeGotoKind]: {
    page: pageNameConstants.storePepoWebView,
    mandatoryValues: [],
    optionalValues: []
  },

  [goToConstants.supportGotoKind]: {
    page: pageNameConstants.supportWebView,
    mandatoryValues: [],
    optionalValues: []
  },

  [goToConstants.tagGotoKind]: {
    page: pageNameConstants.tagPage,
    mandatoryValues: ['tagId'],
    optionalValues: []
  },

  [goToConstants.communitiesGotoKind]: {
    page: pageNameConstants.channelPage,
    mandatoryValues: ['channelId'],
    optionalValues: []
  },

  // TODO: channels - Temp bug fix.
  channels: {
    page: pageNameConstants.channelPage,
    mandatoryValues: ['channelId'],
    optionalValues: []
  }
};
