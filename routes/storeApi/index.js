const express = require('express');

const rootPrefix = '../..',
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
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
  next();
};

router.use('/web', appendWebVersion, storeApiWebRoutes);

module.exports = router;
