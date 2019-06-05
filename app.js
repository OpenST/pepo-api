const rootPrefix = '.';

const express = require('express'),
  path = require('path'),
  createNamespace = require('continuation-local-storage').createNamespace,
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  helmet = require('helmet'),
  cookieParser = require('cookie-parser'),
  customUrlParser = require('url');

const responseHelper = require(rootPrefix + '/lib/formatter/response'),
  v1Routes = require(rootPrefix + '/routes/v1/index'),
  ValidateAuthCookie = require(rootPrefix + '/lib/authentication/cookie'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  customMiddleware = require(rootPrefix + '/helpers/customMiddleware'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const requestSharedNameSpace = createNamespace('pepoApiNameSpace');

morgan.token('id', function getId(req) {
  return req.id;
});

morgan.token('endTime', function getendTime(req) {
  const hrTime = process.hrtime();

  return hrTime[0] * 1000 + hrTime[1] / 1000000;
});

morgan.token('endDateTime', function getEndDateTime(req) {
  return basicHelper.logDateFormat();
});

const startRequestLogLine = function(req, res, next) {
  const message =
    "Started '" +
    customUrlParser.parse(req.originalUrl).pathname +
    "'  '" +
    req.method +
    "' at " +
    basicHelper.logDateFormat();

  logger.info(message);

  next();
};

/**
 * Assign params
 *
 * @param req
 * @param res
 * @param next
 */
const assignParams = function(req, res, next) {
  // IMPORTANT NOTE: Don't assign parameters before sanitization
  // Also override any request params, related to signatures
  // And finally assign it to req.decodedParams
  req.decodedParams = Object.assign(getRequestParams(req), req.decodedParams);

  next();
};

/**
 * Get request params
 *
 * @param req
 * @return {*}
 */
const getRequestParams = function(req) {
  // IMPORTANT NOTE: Don't assign parameters before sanitization
  if (req.method === 'POST') {
    return req.body;
  } else if (req.method === 'GET') {
    return req.query;
  }

  return {};
};

// Set request debugging/logging details to shared namespace
const appendRequestDebugInfo = function(req, res, next) {
  requestSharedNameSpace.run(function() {
    requestSharedNameSpace.set('reqId', req.id);
    requestSharedNameSpace.set('startTime', req.startTime);
    next();
  });
};

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

// If the process is not a master

// Set worker process title
process.title = 'pepo API node worker';

// Create express application instance
const app = express();

// Add id and startTime to request
app.use(customMiddleware());

// Load Morgan
app.use(
  morgan(
    '[:id][:endTime] Completed with ":status" in :response-time ms at :endDateTime -  ":res[content-length] bytes" - ":remote-addr" ":remote-user" - "HTTP/:http-version :method :url" - ":referrer" - ":user-agent"'
  )
);

// Helmet helps secure Express apps by setting various HTTP headers.
app.use(helmet());

// Node.js body parsing middleware.
app.use(bodyParser.json());

// Parsing the URL-encoded data with the qs library (extended: true)
app.use(bodyParser.urlencoded({ extended: true }));

// Node.js cookie parsing middleware.
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  '/api/v1',
  startRequestLogLine,
  appendRequestDebugInfo,
  sanitizer.sanitizeBodyAndQuery,
  assignParams,
  appendV1Version,
  v1Routes
);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  const message =
    "Cannot Find '" +
    customUrlParser.parse(req.originalUrl).pathname +
    "'  '" +
    req.method +
    "' at " +
    basicHelper.logDateFormat();
  logger.step(message);

  return responseHelper
    .error({
      internal_error_identifier: 'a_5',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    })
    .renderResponse(res, errorConfig);
});

// Error handler
app.use(function(err, req, res, next) {
  logger.error('a_6', 'Something went wrong', err);

  return responseHelper
    .error({
      internal_error_identifier: 'a_6',
      api_error_identifier: 'something_went_wrong',
      debug_options: {}
    })
    .renderResponse(res, errorConfig);
});

module.exports = app;
