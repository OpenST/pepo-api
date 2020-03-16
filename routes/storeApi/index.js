const express = require('express');

const rootPrefix = '../..',
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  storeApiWebRoutes = require(rootPrefix + '/routes/storeApi/web/index');

const router = express.Router();

/**
 * Append web version for storeApi
 *
 * @param req
 * @param res
 * @param next
 */
const appendWebVersion = function(req, res, next) {
  req.decodedParams.apiVersion = apiVersions.web;
  req.decodedParams.api_source = apiSourceConstants.store;
  next();
};

router.use('/web', appendWebVersion, storeApiWebRoutes);

module.exports = router;
