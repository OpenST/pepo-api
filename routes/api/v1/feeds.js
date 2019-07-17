const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/* Content Feeds*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  let r = responseHelper.successWithData(require(rootPrefix + '/test/fake/feed.json'));

  Promise.resolve(responseHelper.renderApiResponse(r, res, {}));
});

module.exports = router;
