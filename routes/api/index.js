'use strict';

const express = require('express');

const rootPrefix = '../..',
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  v1Routes = require(rootPrefix + '/routes/api/v1/index');

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

router.use('/v1', appendV1Version, v1Routes);

module.exports = router;
