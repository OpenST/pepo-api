const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  appleAuthRoutes = require(rootPrefix + '/routes/api/web/connect/apple'),
  githubAuthRoutes = require(rootPrefix + '/routes/api/web/connect/github'),
  googleAuthRoutes = require(rootPrefix + '/routes/api/web/connect/google'),
  twitterAuthRoutes = require(rootPrefix + '/routes/api/web/connect/twitter');

router.use('/github', githubAuthRoutes);
router.use('/twitter', twitterAuthRoutes);
router.use('/apple', appleAuthRoutes);
router.use('/google', googleAuthRoutes);

/* Logout user. */
router.post('/logout', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.logout;

  const resp = responseHelper.successWithData({});

  return res.status(200).json(resp); // Deliberately returning success response.
});

module.exports = router;
