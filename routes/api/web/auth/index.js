const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  appleAuthRoutes = require(rootPrefix + '/routes/api/web/auth/apple'),
  githubAuthRoutes = require(rootPrefix + '/routes/api/web/auth/github'),
  googleAuthRoutes = require(rootPrefix + '/routes/api/web/auth/google'),
  twitterAuthRoutes = require(rootPrefix + '/routes/api/web/auth/twitter');

router.use('/github', githubAuthRoutes);
router.use('/twitter', twitterAuthRoutes);
router.use('/apple', appleAuthRoutes);
router.use('/google', googleAuthRoutes);

module.exports = router;
