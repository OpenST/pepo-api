const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  LoggedInUserFormatter = require(rootPrefix + '/lib/formatter/entity/LoggedInUser'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Create user*/
router.get('/sign-up', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.signUp;

  const dataFormatterFunc = async function(serviceResponse) {
    const loggedInUserFormatterRsp = await new LoggedInUserFormatter(serviceResponse.data).perform();

    serviceResponse.data = loggedInUserFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/userManagement/SignUp', 'r_v1_wa_l_s_1', null, dataFormatterFunc)
  );
});

module.exports = router;
