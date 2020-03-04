const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  authRoutes = require(rootPrefix + '/routes/api/web/auth'),
  sessionAuthRoutes = require(rootPrefix + '/routes/api/web/sessionAuth'),
  userRoutes = require(rootPrefix + '/routes/api/web/users'),
  feedsRoutes = require(rootPrefix + '/routes/api/web/feeds'),
  videoRoutes = require(rootPrefix + '/routes/api/web/videos'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  reportRoutes = require(rootPrefix + '/routes/api/web/report'),
  supportRoutes = require(rootPrefix + '/routes/api/web/support'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

router.use('/support', supportRoutes);

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));

// NOTE: CSRF COOKIE SHOULD NOT BE SET HERE. IT SHOULD ONLY BE SET AT WEB. DO NOT UNCOMMENT-AMAN
// router.use(cookieHelper.setWebCsrf());

router.use('/auth', authRoutes);
router.use('/report', reportRoutes);

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

// Login not mandatory for following

router.use(cookieHelper.validateUserWebLoginCookieIfPresent);

router.use('/videos', videoRoutes);
router.use('/feeds', feedsRoutes);

// Login mandatory for following

router.use(cookieHelper.validateUserLoginRequired);

router.use('/users', userRoutes);
router.use(webPageConstants.sessionAuthPagePath, sessionAuthRoutes);

module.exports = router;
