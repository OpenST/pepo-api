'use strict';

const express = require('express');

const rootPrefix = '../../..',
  authRoutes = require(rootPrefix + '/routes/v1/auth');

const router = express.Router();

router.use('/auth', authRoutes);

module.exports = router;
