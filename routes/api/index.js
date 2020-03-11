const express = require('express');

const rootPrefix = '../..',
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  v1Routes = require(rootPrefix + '/routes/api/v1/index'),
  webRoutes = require(rootPrefix + '/routes/api/web/index'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  adminRoutes = require(rootPrefix + '/routes/api/admin/index');

const router = express.Router();

/**
 * app apis common
 *
 * @param req
 * @param res
 * @param next
 */
const appApisCommon = function(req, res, next) {
  req.decodedParams.apiVersion = apiVersions.v1;
  req.decodedParams.api_source = apiSourceConstants.app;
  req.decodedParams.dev_login = false;
  next();
};

/**
 * Append Admin version
 *
 * @param req
 * @param res
 * @param next
 */
const adminApisCommon = function(req, res, next) {
  req.decodedParams.apiVersion = apiVersions.admin;
  req.decodedParams.api_source = apiSourceConstants.admin;
  req.decodedParams.dev_login = false;
  next();
};

/**
 * Append web version
 *
 * @param req
 * @param res
 * @param next
 */
const webApisCommon = function(req, res, next) {
  req.decodedParams.apiVersion = apiVersions.web;
  req.decodedParams.dev_login = basicHelper.isRequestFromPepoDevEnvAndSupported(req) || false;
  next();
};

// api v1 routes
router.use('/v1', appApisCommon, v1Routes);

// web api routes
router.use('/web', webApisCommon, webRoutes);

// admin api routes
router.use('/admin', adminApisCommon, adminRoutes);

module.exports = router;
