const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  authRoutes = require(rootPrefix + '/routes/api/v1/auth'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  usersRoutes = require(rootPrefix + '/routes/api/v1/users'),
  invitesRoutes = require(rootPrefix + '/routes/api/v1/invites'),
  topupRoutes = require(rootPrefix + '/routes/api/v1/topup'),
  videoRoutes = require(rootPrefix + '/routes/api/v1/videos'),
  tokensRoutes = require(rootPrefix + '/routes/api/v1/tokens'),
  feedsRoutes = require(rootPrefix + '/routes/api/v1/feeds'),
  redemptionsRoutes = require(rootPrefix + '/routes/api/v1/redemptions'),
  supportRoutes = require(rootPrefix + '/routes/api/v1/support'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  tagRoutes = require(rootPrefix + '/routes/api/v1/tags'),
  notificationsRoutes = require(rootPrefix + '/routes/api/v1/notifications'),
  fetchGotoRoutes = require(rootPrefix + '/routes/api/v1/fetchGoto'),
  twitterRoutes = require(rootPrefix + '/routes/api/v1/twitter'),
  uploadParamsRoutes = require(rootPrefix + '/routes/api/v1/uploadParams'),
  rotateTwitterAccountRoutes = require(rootPrefix + '/routes/api/v1/rotateTwitterAccount'),
  reportIssueRoutes = require(rootPrefix + '/routes/api/v1/reportIssue'),
  reportRoutes = require(rootPrefix + '/routes/api/v1/report'),
  ostTransactionRoutes = require(rootPrefix + '/routes/api/v1/ostTransactions');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

// TEMP route - only for QA - TODO - remove later after talking with SOMA
router.use('/rotate-twitter-account', rotateTwitterAccountRoutes);

router.use('/report-issue', reportIssueRoutes);
router.use('/auth', authRoutes);
router.use('/fetch-goto', fetchGotoRoutes);

// Login not mandatory for following
router.use('/feeds', cookieHelper.validateUserLoginCookieIfPresent, feedsRoutes);
router.use('/videos', cookieHelper.validateUserLoginCookieIfPresent, videoRoutes);
router.use('/report', cookieHelper.validateUserLoginCookieIfPresent, reportRoutes);

router.use(cookieHelper.validateUserLoginCookieIfPresent, cookieHelper.validateUserLoginRequired);

router.use('/users', usersRoutes);
router.use('/invites', invitesRoutes);
router.use('/tokens', tokensRoutes);
router.use('/ost-transactions', ostTransactionRoutes);
router.use('/redemptions', redemptionsRoutes);
router.use('/support', supportRoutes);
router.use('/upload-params', uploadParamsRoutes);
router.use('/tags', tagRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/top-up', topupRoutes);
router.use('/twitter', twitterRoutes);

module.exports = router;
