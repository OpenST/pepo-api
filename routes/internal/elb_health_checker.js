const express = require('express');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

const router = express.Router(),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.internal);

/* Elb health checker request */
router.get('/', function(req, res, next) {
  const performer = function() {
    // 200 OK response needed for ELB Health checker
    if (req.headers['user-agent'] === 'ELB-HealthChecker/2.0') {
      return responseHelper.successWithData({}).renderResponse(res, errorConfig);
    } else {
      return responseHelper
        .error({
          internal_error_identifier: 'r_i_e_h_c_1',
          api_error_identifier: 'resource_not_found',
          debug_options: {}
        })
        .renderResponse(res, errorConfig);
    }
  };

  performer();
});

router.get('/caching-test-1', function(req, res, next) {
  const performer = function() {
    console.log('\n\nreq.headers: ', req.headers);

    var dt = new Date();
    var currentMinute = dt.getMinutes();
    var headerDt = new Date(req.headers['if-modified-since']);
    var headerMinute = headerDt.getMinutes();

    console.log('currentMinute: ', currentMinute, ' --- headerMinute', headerMinute);

    if (currentMinute === headerMinute) {
      res.status(304).send();
    } else {
      res.setHeader('Last-Modified', dt);
      res.status(200).json({ minute: currentMinute, date: dt });
    }
  };

  performer();
});

module.exports = router;
