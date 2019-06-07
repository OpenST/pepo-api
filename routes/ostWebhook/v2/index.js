'use strict';

const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  OstEventCreateService = require(rootPrefix + '/app/services/ostEvents/Create');

/* Listen to Ost Events*/
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const performer = function() {
    let reponse = OstEventCreateService.new(req.decodedParams).perform();
    return reponse.renderResponse(res);
  };

  performer();
});

module.exports = router;
