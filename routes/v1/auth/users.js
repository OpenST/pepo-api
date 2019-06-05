const express = require('express'),
  router = express.Router();

const rootPrefix = '../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserFormatter = require(rootPrefix + '/lib/formatter/entity/User'),
  resultType = require(rootPrefix + '/lib/globalConstant/resultType'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

// Following require(s) for registering into instance composer
require(rootPrefix + '/app/services/user/Create');

/* Create user*/
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.createUser;

  //NOTE: Mandatory to override kind value here. As we don't want company kind users to be created from this API.
  req.decodedParams.kind = tokenUserConstants.userKind;

  const dataFormatterFunc = async function(serviceResponse) {
    const userFormattedRsp = await new UserFormatter(serviceResponse.data[resultType.user]).perform();
    serviceResponse.data = {
      result_type: resultType.user,
      [resultType.user]: userFormattedRsp.data
    };
  };

  Promise.resolve(routeHelper.perform(req, res, next, 'CreateUser', 'r_v1_u_1', null, dataFormatterFunc));
});

module.exports = router;
