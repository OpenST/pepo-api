const express = require('express');

const rootPrefix = '../..',
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  v1Routes = require(rootPrefix + '/routes/api/v1/index'),
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

router.use('/v1', appendV1Version, v1Routes);
router.use('/admin', appendAdminVersion, adminRoutes);

module.exports = router;
