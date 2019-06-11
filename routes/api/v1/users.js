const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  UserListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserList'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/* Register Device*/
router.post('/register-device', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.registerDevice;

  const onServiceSuccess = async function(serviceResponse) {
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.device,
      entities: [entityType.device],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/RegisterDevice', 'r_a_v1_u_1', null, onServiceSuccess));
});

/* Recovery Info Device*/
router.get('/recovery-info', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.recoveryInfo;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.recoveryInfo,
      entities: [entityType.recoveryInfo],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/RecoveryInfo', 'r_a_v1_u_2', null, dataFormatterFunc));
});

/* User List*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.users;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.users,
      entities: [entityType.users],
      serviceData: serviceResponse.data.users
    }).perform();

    let serviceResponseMeta = serviceResponse.data.meta,
      finalMetaResponse = {};

    if (serviceResponseMeta && CommonValidators.validateObject(serviceResponseMeta)) {
      finalMetaResponse = await new UserListMetaFormatter({ meta: serviceResponse.data.meta }).perform().data;
    }

    serviceResponse.data = wrapperFormatterRsp.data;
    serviceResponse.data.meta = finalMetaResponse;

    console.log('User List:::::serviceResponse-----', serviceResponse);
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/List', 'r_a_v1_u_3', null, dataFormatterFunc));
});

module.exports = router;
