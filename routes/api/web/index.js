const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  authRoutes = require(rootPrefix + '/routes/api/web/auth/index'),
  sessionAuthRoutes = require(rootPrefix + '/routes/api/web/sessionAuth'),
  ostTransactionRoutes = require(rootPrefix + '/routes/api/web/ostTransactions'),
  userRoutes = require(rootPrefix + '/routes/api/web/users'),
  feedsRoutes = require(rootPrefix + '/routes/api/web/feeds'),
  searchRoutes = require(rootPrefix + '/routes/api/web/search'),
  videoRoutes = require(rootPrefix + '/routes/api/web/videos'),
  channelRoutes = require(rootPrefix + '/routes/api/web/channels'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  reportRoutes = require(rootPrefix + '/routes/api/web/report'),
  supportRoutes = require(rootPrefix + '/routes/api/web/support'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage');

/**
 * Append api_source
 *
 * @param req
 * @param res
 * @param next
 */
const setWebViewApiSource = function(req, res, next) {
  req.decodedParams.api_source = apiSourceConstants.webView;
  next();
};

/**
 * Append api_source
 *
 * @param req
 * @param res
 * @param next
 */
const setWebApiSource = function(req, res, next) {
  req.decodedParams.api_source = apiSourceConstants.web;
  next();
};

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));

// CSRF check
router.use(cookieHelper.setWebCsrf());

//
// NOTE: Different cookie secret is used. Handled inside.
//
router.use('/support', setWebViewApiSource, supportRoutes);

router.use(setWebApiSource);
//
// NOTE: Login not mandatory for following
//
router.use(cookieHelper.validateUserWebLoginCookieIfPresent);

router.use('/auth', authRoutes);
router.use('/videos', videoRoutes);
router.use('/feeds', feedsRoutes);
router.use('/search', searchRoutes);
router.use('/report', reportRoutes);
router.use('/channels', channelRoutes);
router.use('/users', userRoutes);

//
// NOTE: Login mandatory for following
//
router.use(cookieHelper.validateUserWebLoginCookieRequired);

router.use(webPageConstants.sessionAuthPagePath, sessionAuthRoutes);
// TODO - login - why route is inside webPageConstants?
router.use(webPageConstants.ostTransactionsPagePath, ostTransactionRoutes);

module.exports = router;
