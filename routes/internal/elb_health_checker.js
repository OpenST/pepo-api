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
  const encodeString = function(str) {
    let buff = new Buffer(str.toString());
    return buff.toString('base64');
  };

  const decodeString = function(str) {
    let buff = new Buffer(str, 'base64');
    return buff.toString('ascii');
  };

  const performer = function() {
    console.log('\n\nreq.headers: ', req.headers);
    console.log('req.cookies: ', req.cookies);
    console.log('req.query: ', req.query);
    console.log('req.body: ', req.body);

    let dt = new Date();
    let currentMinute = dt.getMinutes();
    let headerDt;

    if (req.headers['if-none-match']) {
      // value from ETag response header
      let dtStr = decodeString(req.headers['if-none-match']);
      headerDt = new Date(dtStr);
    } else if (req.headers['if-modified-since']) {
      // value from Last-Modified response header
      headerDt = new Date(req.headers['if-modified-since']);
    }

    let headerMinute = headerDt ? headerDt.getMinutes() : -1;

    console.log('currentMinute: ', currentMinute, ' --- headerMinute', headerMinute);
    if (currentMinute === headerMinute) {
      // res.cookie('bl_ck1', dt.toString(), {maxAge: 900000, httpOnly: true});

      res.status(304).send();
    } else {
      // Set headers
      res.setHeader('Date', dt);
      res.setHeader('Last-Modified', dt);
      let etagData = encodeString(dt);
      res.setHeader('ETag', etagData);
      res.setHeader('Vary', '*');
      res.setHeader('Cache-Control', 'max-age=120, must-revalidate');

      // Set cookie
      // res.cookie('bl_ck1',dt.toString(), { maxAge: 900000, httpOnly: true });

      // Set response
      res.status(200).json({ minute: currentMinute, date: dt });
    }
  };

  performer();
});

module.exports = router;
