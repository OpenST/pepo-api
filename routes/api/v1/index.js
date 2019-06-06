'use strict';

const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  authRoutes = require(rootPrefix + '/routes/api/v1/auth'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  usersRoutes = require(rootPrefix + '/routes/api/v1/users');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

const validateCookie = async function(req, res, next) {
  let loginCookieValue = req.signedCookies[userConstant.loginCookieName];
  let authResponse = await new LoginCookieAuth(loginCookieValue).perform().catch(function(r) {
    return r;
  });

  if (authResponse.isFailure()) {
    return authResponse.renderResponse(res, errorConfig);
  }

  req.decodedParams.currentUser = authResponse.data.currentUser;

  next();
};

router.use('/auth', authRoutes);
router.use('/users', validateCookie, usersRoutes);

module.exports = router;
