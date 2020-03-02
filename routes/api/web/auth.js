const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  githubAuthRoutes = require(rootPrefix + '/routes/api/web/github');

router.use('/github', githubAuthRoutes);

/* Logout user. */
router.post('/logout', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.logout;

  const resp = responseHelper.successWithData({});

  return res.status(200).json(resp); // Deliberately returning success response.
});

module.exports = router;
