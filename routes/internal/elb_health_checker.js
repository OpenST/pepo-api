const express = require('express');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

const router = express.Router(),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.internal);

let cookieParser = require('cookie-parser');
router.use(cookieParser());

/* Elb health checker request */
router.get('/', function(req, res, next) {
  const performer = function() {
    // 200 OK response needed for ELB Health checker
    if (req.headers['user-agent'] === 'ELB-HealthChecker/2.0') {
      return responseHelper.renderApiResponse(responseHelper.successWithData({}), res, errorConfig);
    } else {
      return responseHelper.renderApiResponse(
        responseHelper.error({
          internal_error_identifier: 'r_i_e_h_c_1',
          api_error_identifier: 'resource_not_found',
          debug_options: {}
        }),
        res,
        errorConfig
      );
    }
  };

  performer();
});

/* Test routes */

const encodeString = function(str) {
  let buff = new Buffer.from(str.toString());
  return buff.toString('base64');
};

const decodeString = function(str) {
  let buff = new Buffer.from(str, 'base64');
  return buff.toString('ascii');
};

router.get('/set-cookie', function(req, res, next) {
  const performer = function() {
    console.log('\n\nreq.headers: ', req.headers);
    console.log('req.cookies: ', req.cookies);
    console.log('req.query: ', req.query);
    console.log('req.body: ', req.body);

    let dt = new Date();

    let cookieOptions = {
      maxAge: 1000 * 60 * 15, // would expire after 15 minutes
      httpOnly: true, // The cookie only accessible by the web server
      // signed: true, // Indicates if the cookie should be signed
      path: '/'
    };
    let val = req.query['v'] ? dt.toString() + req.query['v'] : dt.toString();
    let etagData = encodeString(val);

    // Set headers
    res.setHeader('Date', dt);

    // Set cookie
    res.cookie('bl_ck1', etagData, cookieOptions);

    // Set response
    res.status(200).json({ setCookie: true, v: req.query['v'] });
  };

  performer();
});

router.get('/get-cookie', function(req, res, next) {
  const performer = function() {
    console.log('\n\nreq.headers: ', req.headers);
    console.log('req.cookies: ', req.cookies);
    console.log('req.query: ', req.query);
    console.log('req.body: ', req.body);

    let dt = new Date();
    let currentMinute = dt.getMinutes();
    let headerDt;
    let headerVal;

    if (req.headers['if-none-match']) {
      // value from ETag response header
      headerVal = decodeString(req.headers['if-none-match']);
    } else if (req.headers['if-modified-since']) {
      // value from Last-Modified response header
      headerDt = new Date(req.headers['if-modified-since']);
    }

    let val = req.query['v'] ? req.query['v'] : '';
    let etagData = encodeString(val);

    let headerMinute = headerDt ? headerDt.getMinutes() : -1;

    console.log('currentMinute: ', currentMinute, ' --- headerMinute', headerMinute);
    if (headerVal === req.query['v']) {
      res.status(304).send();
    } else {
      // Set headers
      res.setHeader('Date', dt);
      res.setHeader('Last-Modified', dt);
      console.log('ETag Val: ', val);
      res.setHeader('ETag', etagData);
      res.setHeader('Vary', '*');
      res.setHeader('Cache-Control', 'max-age=120, must-revalidate');
      res.setHeader('PepoCache', etagData);

      // Set response
      res.status(200).json({ minute: currentMinute, date: dt, v: req.query['v'] });
    }
  };

  performer();
});

module.exports = router;
