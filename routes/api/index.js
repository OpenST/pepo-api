'use strict';

const express = require('express'),
  cookieParser = require('cookie-parser');

const rootPrefix = '../..',
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  v1Routes = require(rootPrefix + '/routes/api/v1/index');

const router = express.Router();

// Node.js cookie parsing middleware.
router.use(cookieParser('test123'));

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

// router.use('/', function(req, res) {
//   // Cookies that have not been signed
//   console.log('Cookies: ', req.cookies);
//
//   // Cookies that have been signed
//   console.log('Signed Cookies: ', req.signedCookies);
//
//   console.log('cookie value', req.signedCookies.cookieName);
//
//   // var cookie = require('cookie');
//   // cookie.serialize('name', 'value');
//
//   let options = {
//     maxAge: 1000 * 60 * 15, // would expire after 15 minutes
//     httpOnly: true, // The cookie only accessible by the web server
//     signed: true // Indicates if the cookie should be signed
//   };
//
//   // Set cookie
//   res.cookie('cookieName', 'cookieValue', options); // options is optional
//
//   res.status(200).json({ hello: 'world' });
// });

router.use('/v1', appendV1Version, v1Routes);

module.exports = router;
