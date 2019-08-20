const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  AdminCookieAuth = require(rootPrefix + '/lib/authentication/AdminCookie'),
  authRoutes = require(rootPrefix + '/routes/api/v1/auth'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  usersRoutes = require(rootPrefix + '/routes/api/v1/users'),
  videoRoutes = require(rootPrefix + '/routes/api/v1/videos'),
  tokensRoutes = require(rootPrefix + '/routes/api/v1/tokens'),
  gifsRoutes = require(rootPrefix + '/routes/api/v1/gifs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedsRoutes = require(rootPrefix + '/routes/api/v1/feeds'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  tagRoutes = require(rootPrefix + '/routes/api/v1/tags'),
  userNotificationsRoutes = require(rootPrefix + '/routes/api/v1/userNotifications'),
  adminRoutes = require(rootPrefix + '/routes/api/v1/admin'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  uploadParamsRoutes = require(rootPrefix + '/routes/api/v1/uploadParams'),
  rotateTwitterAccountRoutes = require(rootPrefix + '/routes/api/v1/rotateTwitterAccount'),
  ostTransactionRoutes = require(rootPrefix + '/routes/api/v1/ostTransactions');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

const validateCookie = async function(req, res, next) {
  let loginCookieValue = req.signedCookies[userConstant.loginCookieName];
  if (!commonValidator.isVarNullOrUndefined(loginCookieValue)) {
    let authResponse = await new LoginCookieAuth(loginCookieValue).perform().catch(function(r) {
      return r;
    });

    if (authResponse.isFailure()) {
      cookieHelper.deleteLoginCookie(res);
      return responseHelper.renderApiResponse(authResponse, res, errorConfig);
    } else {
      req.decodedParams.current_user = authResponse.data.current_user;
      req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
    }
    cookieHelper.setLoginCookie(res, authResponse.data.user_login_cookie_value);
  }

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

  next();
};

const validateAdminCookie = async function(req, res, next) {
  // Cookie validation is not to be done for admin login request
  if (req.url !== '/login') {
    let adminCookieValue = req.signedCookies[adminConstants.loginCookieName];
    let authResponse = await new AdminCookieAuth(adminCookieValue).perform().catch(function(r) {
      return r;
    });

    if (authResponse.isFailure()) {
      cookieHelper.deleteAdminCookie(res);
      return responseHelper.renderApiResponse(authResponse, res, errorConfig);
    } else {
      req.decodedParams.current_admin = authResponse.data.current_admin;
      req.decodedParams.admin_login_cookie_value = authResponse.data.admin_login_cookie_value;
    }
    cookieHelper.setAdminCookie(res, authResponse.data.admin_login_cookie_value);
  }

  next();
};

// NOTE:- use 'validateLoginRequired' function if you want to use route in logged in only

router.use('/auth/twitter-disconnect', validateCookie, validateLoginRequired, authRoutes);
router.use('/auth', authRoutes);
router.use('/users', validateCookie, validateLoginRequired, usersRoutes);
router.use('/videos', validateCookie, validateLoginRequired, videoRoutes);
router.use('/tokens', validateCookie, validateLoginRequired, tokensRoutes);
router.use('/ost-transactions', validateCookie, validateLoginRequired, ostTransactionRoutes);
router.use('/gifs', validateCookie, validateLoginRequired, gifsRoutes);
router.use('/upload-params', validateCookie, validateLoginRequired, uploadParamsRoutes);
router.use('/tags', validateCookie, validateLoginRequired, tagRoutes);
router.use('/admin', validateAdminCookie, adminRoutes);
router.use('/notifications', validateCookie, validateLoginRequired, userNotificationsRoutes);

// TEMP route - only for QA - TODO - remove later after talking with SOMA
router.use('/rotate-twitter-account', rotateTwitterAccountRoutes);

// Login not mandatory for following
router.use('/feeds', validateCookie, feedsRoutes);

module.exports = router;
