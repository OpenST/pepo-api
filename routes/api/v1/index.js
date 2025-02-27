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
  sessionAuthsRoutes = require(rootPrefix + '/routes/api/v1/sessionAuths'),
  supportRoutes = require(rootPrefix + '/routes/api/v1/support'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  tagRoutes = require(rootPrefix + '/routes/api/v1/tags'),
  channelRoutes = require(rootPrefix + '/routes/api/v1/channels'),
  searchRoutes = require(rootPrefix + '/routes/api/v1/search'),
  notificationsRoutes = require(rootPrefix + '/routes/api/v1/notifications'),
  fetchGotoRoutes = require(rootPrefix + '/routes/api/v1/fetchGoto'),
  twitterRoutes = require(rootPrefix + '/routes/api/v1/twitter'),
  uploadParamsRoutes = require(rootPrefix + '/routes/api/v1/uploadParams'),
  rotateAccountRoutes = require(rootPrefix + '/routes/api/v1/rotateAccount'),
  reportIssueRoutes = require(rootPrefix + '/routes/api/v1/reportIssue'),
  reportRoutes = require(rootPrefix + '/routes/api/v1/report'),
  pepocornTopUpRoutes = require(rootPrefix + '/routes/api/v1/pepocornTopUps'),
  ostTransactionRoutes = require(rootPrefix + '/routes/api/v1/ostTransactions'),
  replyRoutes = require(rootPrefix + '/routes/api/v1/replies');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

// TEMP route START- only for QA
router.use('/rotate-account', rotateAccountRoutes);
// TEMP route END - only for QA

router.use('/report-issue', reportIssueRoutes);
router.use('/auth', authRoutes);
router.use('/fetch-goto', fetchGotoRoutes);

// Login not mandatory for following

router.use(cookieHelper.validateUserLoginCookieIfPresent);

router.use('/feeds', feedsRoutes);
router.use('/videos', videoRoutes);
router.use('/report', reportRoutes);
router.use('/replies', replyRoutes);
router.use('/channels', channelRoutes);

// Login mandatory for following

router.use('/search', searchRoutes);

router.use(cookieHelper.validateUserLoginRequired);

router.use('/users', usersRoutes);
router.use('/invites', invitesRoutes);
router.use('/tokens', tokensRoutes);
router.use('/ost-transactions', ostTransactionRoutes);
router.use('/redemptions', redemptionsRoutes);
router.use('/session-auth', sessionAuthsRoutes);
router.use('/support', supportRoutes);
router.use('/upload-params', uploadParamsRoutes);
router.use('/tags', tagRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/top-up', topupRoutes);
router.use('/twitter', twitterRoutes);
router.use('/pepocorn-topups', pepocornTopUpRoutes);

module.exports = router;
