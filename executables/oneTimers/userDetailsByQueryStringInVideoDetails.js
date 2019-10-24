/**
 * One timer to fetch user details by query string in video details.
 *
 * Usage: node executables/oneTimers/userDetailsByQueryStringInVideoDetails --words ""test", "good""
 *
 * @module  executables/oneTimers/userDetailsByQueryStringInVideoDetails
 */
const program = require('commander');

const rootPrefix = '../..',
  ByQueryStringInVideoDetails = require(rootPrefix + '/lib/user/getData/ByQueryStringInVideoDetails'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program.option('--words <words>', 'Words Array').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(' node executables/oneTimers/userDetailsByQueryStringInVideoDetails --words ""test", "good""');
  logger.log('');
  logger.log('');
});

if (!program.words) {
  program.help();
  process.exit(1);
}

class GetUserDetailsByQueryStringInVideoDetails {
  /**
   * Constructor to GetUserDetailsByQueryStringInVideoDetails.
   *
   * @param {string} params.words
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.words = params.words;
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.fetchSignupDetails();
  }

  /**
   * Fetch signup details.
   *
   * @returns {Promise<void>}
   */
  async fetchSignupDetails() {
    const oThis = this;

    logger.log('Words to search: ', oThis.words);

    const wordsArray = basicHelper.commaSeparatedStrToArray(oThis.words);

    if (wordsArray.length === 0) {
      logger.error('Words array is empty.');
    }

    await new ByQueryStringInVideoDetails({ words: wordsArray }).perform();
  }
}

new GetUserDetailsByQueryStringInVideoDetails({
  words: program.words
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
