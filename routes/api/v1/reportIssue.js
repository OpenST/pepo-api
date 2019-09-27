const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/* Rotate twitter account */
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.reportIssueForWeb;

  Promise.resolve(routeHelper.perform(req, res, next, '/ReportIssue', 'r_a_v1_ri_1', null));
});

module.exports = router;
