const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  authRoutes = require(rootPrefix + '/routes/api/web/auth/index'),
  sessionAuthRoutes = require(rootPrefix + '/routes/api/web/sessionAuth'),
  ostTransactionRoutes = require(rootPrefix + '/routes/api/web/ostTransactions'),
  userRoutes = require(rootPrefix + '/routes/api/web/users'),
  feedsRoutes = require(rootPrefix + '/routes/api/web/feeds'),
  videoRoutes = require(rootPrefix + '/routes/api/web/videos'),
  communityRoutes = require(rootPrefix + '/routes/api/web/community'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  reportRoutes = require(rootPrefix + '/routes/api/web/report'),
  supportRoutes = require(rootPrefix + '/routes/api/web/support'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage');

//
// NOTE: Different cookie secret is used. Handled inside.
//
router.use('/support', supportRoutes);

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));

router.use('/prelaunch', preLaunchRoutes);

// CSRF check
router.use(cookieHelper.setWebCsrf());

//
// NOTE: Login not mandatory for following
//
router.use(cookieHelper.validateUserWebLoginCookieIfPresent);

router.use('/auth', authRoutes);
router.use('/videos', videoRoutes);
router.use('/feeds', feedsRoutes);
router.use('/report', reportRoutes);
router.use('/communities', communityRoutes);

//
// NOTE: Login mandatory for following
//
router.use(cookieHelper.validateUserLoginRequired);

router.use('/users', userRoutes);
router.use(webPageConstants.sessionAuthPagePath, sessionAuthRoutes);
router.use(webPageConstants.ostTransactionsPagePath, ostTransactionRoutes);

module.exports = router;
