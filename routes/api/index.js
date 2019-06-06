'use strict';

const express = require('express');

const rootPrefix = '../..',
  v1Routes = require(rootPrefix + '/routes/api/v1/index');

const router = express.Router();

router.use('/v1', v1Routes);

module.exports = router;
