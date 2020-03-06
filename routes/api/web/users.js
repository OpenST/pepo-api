const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Get url and message for profile given username. */
router.get('/:username/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.profileShare;
  req.decodedParams.username = req.params.username;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.share,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.share]: responseEntityKey.share
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/ShareDetails', 'r_a_w_u_1', null, dataFormatterFunc)
  );
});

/* Double opt in email*/
router.get('/double-opt-in', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.doubleOptIn;

  Promise.resolve(routeHelper.perform(req, res, next, '/VerifyDoubleOptIn', 'r_a_w_u_4', null));
});

//
// NOTE: Login mandatory for following
//
router.use(cookieHelper.validateUserLoginRequired);

/* Logged-In user. */
router.get('/current', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.loggedInUser;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.loggedInUser]: responseEntityKey.loggedInUser,
        [entityTypeConstants.twitterConnectMeta]: responseEntityKey.meta,
        [entityTypeConstants.pricePointsMap]: responseEntityKey.pricePoints,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/init/GetCurrent', 'r_a_w_u_2', null, dataFormatterFunc));
});

/* User websocket details. */
router.get('/:user_id/websocket-details', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.websocketDetails;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.websocketConnectionPayload,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.websocketConnectionPayload]: responseEntityKey.websocketConnectionPayload
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/SocketConnectionDetails', 'r_a_w_u_3', null, dataFormatterFunc)
  );
});

module.exports = router;
