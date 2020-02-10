const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  supportRoutes = require(rootPrefix + '/routes/api/web/support');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));

//NOTE: CSRF COOKIE SHOULD NOT BE SET HERE. IT SHOULD ONLY BE SET AT WEB. DO NOT UNCOMMENT-AMAN
// router.use(cookieHelper.setWebCsrf());

router.use('/prelaunch', preLaunchRoutes);

router.use('/support', supportRoutes);

/* Get url and message for sharing channel given its permalink. */
router.get('/communities/:channel_permalink/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.channelShare;
  req.decodedParams.channel_permalink = req.params.channel_permalink;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/ShareDetails', 'r_a_w_1', null, dataFormatterFunc));
});

/* Get url and message for profile given username. */
router.get('/users/:username/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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
    routeHelper.perform(req, res, next, '/user/profile/ShareDetails', 'r_a_w_2', null, dataFormatterFunc)
  );
});

module.exports = router;
