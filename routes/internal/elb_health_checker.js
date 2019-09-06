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

module.exports = router;
