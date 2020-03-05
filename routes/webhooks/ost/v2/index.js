const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  OstEventCreateService = require(rootPrefix + '/app/services/ostEvents/Create'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Listen to ost events. */
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const performer = async function() {
    const response = await new OstEventCreateService(req.decodedParams).perform();

    return responseHelper.renderApiResponse(response, res, errorConfig);
  };

  performer();
});

module.exports = router;
