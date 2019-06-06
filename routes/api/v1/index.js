'use strict';

const express = require('express');

const rootPrefix = '../../..',
  authRoutes = require(rootPrefix + '/routes/api/v1/auth'),
  usersRoutes = require(rootPrefix + '/routes/api/v1/users');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;
