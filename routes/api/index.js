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
 * Append V1 version
 *
 * @param req
 * @param res
 * @param next
 */
const appendV1Version = function(req, res, next) {
  req.decodedParams.apiVersion = apiVersions.v1;
  next();
};

/**
 * Append Admin version
 *
 * @param req
 * @param res
 * @param next
 */
const appendAdminVersion = function(req, res, next) {
  req.decodedParams.apiVersion = apiVersions.admin;
  next();
};

/**
 * Append web version
 *
 * @param req
 * @param res
 * @param next
 */
const appendWebVersion = function(req, res, next) {
  req.decodedParams.apiVersion = apiVersions.web;
  req.decodedParams.api_source = apiSourceConstants.web;
  req.decodedParams.dev_login = basicHelper.isRequestFromPepoDevEnvAndSupported(req) || false;
  next();
};

router.use('/v1', appendV1Version, v1Routes);
router.use('/web', appendWebVersion, webRoutes);
router.use('/admin', appendAdminVersion, adminRoutes);

module.exports = router;
