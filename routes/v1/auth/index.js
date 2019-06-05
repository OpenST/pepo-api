'use strict';

const express = require('express');

const rootPrefix = '../../..',
  userRoutes = require(rootPrefix + '/routes/v1/auth/users');

const router = express.Router();

router.use('/users', userRoutes);

module.exports = router;
