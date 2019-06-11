'use strict';

const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  OstEventCreateService = require(rootPrefix + '/app/services/ostEvents/Create'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Listen to Ost Events*/
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const performer = async function() {
    let response = await new OstEventCreateService(req.decodedParams).perform();
    return response.renderResponse(res);
  };

  performer();
});

module.exports = router;
