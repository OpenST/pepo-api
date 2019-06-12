const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  OstEventCreateService = require(rootPrefix + '/app/services/ostEvents/Create'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Listen to Ost Events*/
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const performer = async function() {
    let response = await new OstEventCreateService(req.decodedParams).perform();
    return response.renderResponse(res, errorConfig);
  };

  performer();
});

module.exports = router;
