const express = require('express'),
  router = express.Router();

const rootPrefix = '../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  resultType = require(rootPrefix + '/lib/globalConstant/resultType'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Create user*/
router.post('/signup', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.signup;

  const dataFormatterFunc = async function(serviceResponse) {
    serviceResponse.data = {
      result_type: resultType.user,
      [resultType.user]: serviceResponse.data
    };
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, 'userManagement/SignUp', 'r_v1_wa_l_s_1', null, dataFormatterFunc)
  );
});

module.exports = router;
