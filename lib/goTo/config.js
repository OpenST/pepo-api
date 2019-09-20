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
  }
};
