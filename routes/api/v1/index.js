const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  authRoutes = require(rootPrefix + '/routes/api/v1/auth'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  usersRoutes = require(rootPrefix + '/routes/api/v1/users'),
  tokensRoutes = require(rootPrefix + '/routes/api/v1/tokens'),
  gifsRoutes = require(rootPrefix + '/routes/api/v1/gifs'),
  feedsRoutes = require(rootPrefix + '/routes/api/v1/feeds'),
  ostTransactionRoutes = require(rootPrefix + '/routes/api/v1/ostTransactions');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

const validateCookie = async function(req, res, next) {
  let loginCookieValue = req.signedCookies[userConstant.loginCookieName];
  let authResponse = await new LoginCookieAuth(loginCookieValue).perform().catch(function(r) {
    // TODO: Delete cookie. Are we sending 401 response?
    return r;
  });

  if (authResponse.isFailure()) {
    // TODO: Delete cookie. Are we sending 401 response?
    return authResponse.renderResponse(res, errorConfig);
  }

  // TODO: Cookie time is not extended here

  req.decodedParams.current_user = authResponse.data.current_user;

  next();
};

router.use('/auth', authRoutes);
router.use('/users', validateCookie, usersRoutes);
router.use('/tokens', validateCookie, tokensRoutes);
router.use('/ost-transactions', validateCookie, ostTransactionRoutes);
router.use('/gifs', gifsRoutes);
router.use('/feeds', validateCookie, feedsRoutes);

module.exports = router;
