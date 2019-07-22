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
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedsRoutes = require(rootPrefix + '/routes/api/v1/feeds'),
  feedRoutes = require(rootPrefix + '/routes/api/v1/feed'),
  activitiesRoutes = require(rootPrefix + '/routes/api/v1/activities'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  tagRoutes = require(rootPrefix + '/routes/api/v1/tags'),
  uploadParamsRoutes = require(rootPrefix + '/routes/api/v1/uploadParams'),
  rotateTwitterAccountRoutes = require(rootPrefix + '/routes/api/v1/rotateTwitterAccount'),
  ostTransactionRoutes = require(rootPrefix + '/routes/api/v1/ostTransactions');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

const validateCookie = async function(req, res, next) {
  let loginCookieValue = req.signedCookies[userConstant.loginCookieName];
  let authResponse = await new LoginCookieAuth(loginCookieValue).perform().catch(function(r) {
    return r;
  });

  if (authResponse.isFailure()) {
    cookieHelper.deleteLoginCookie(res);
  } else {
    req.decodedParams.current_user = authResponse.data.current_user;
    req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
  }

  // cookieHelper.setLoginCookie(res, authResponse.data.user_login_cookie_value);

  next();
};

const validateLoginRequired = async function(req, res, next) {
  let currentUser = req.decodedParams.current_user;

  if (!currentUser) {
    cookieHelper.deleteLoginCookie(res);
    return responseHelper.renderApiResponse(
      responseHelper.error({
        internal_error_identifier: 'r_a_v1_i_1',
        api_error_identifier: 'unauthorized_api_request'
      }),
      res,
      errorConfig
    );
  }

  cookieHelper.setLoginCookie(res, req.decodedParams.user_login_cookie_value);

  next();
};

router.use('/auth', authRoutes);
router.use('/users', validateCookie, validateLoginRequired, usersRoutes);
router.use('/tokens', validateCookie, validateLoginRequired, tokensRoutes);
router.use('/ost-transactions', validateCookie, validateLoginRequired, ostTransactionRoutes);
router.use('/gifs', validateCookie, validateLoginRequired, gifsRoutes);
router.use('/feeds', feedsRoutes); // TODO - temp commit - removed validateCookie for feeds. Please revert.
router.use('/feed', validateCookie, validateLoginRequired, feedRoutes);
router.use('/activities', validateCookie, validateLoginRequired, activitiesRoutes);
router.use('/upload-params', uploadParamsRoutes);
router.use('/tags', tagRoutes);
router.use('/rotate-twitter-account', rotateTwitterAccountRoutes);

module.exports = router;
