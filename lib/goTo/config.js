const rootPrefix = '../..',
  goToConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName');

module.exports = {
  [goToConstants.videoGotoKind]: {
    page: pageNameConstants.videoPageName,
    values: ['videoId']
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
  }
};
