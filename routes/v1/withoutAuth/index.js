'use strict';

const express = require('express');

const rootPrefix = '../../..',
  loginRoutes = require(rootPrefix + '/routes/v1/withoutAuth/login');

const router = express.Router();

router.use('/login', loginRoutes);

module.exports = router;
