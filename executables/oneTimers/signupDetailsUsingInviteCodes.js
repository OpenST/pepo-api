/**
 * One timer to fetch signup details given invite codes.
 *
 * Usage: node executables/oneTimers/signupDetailsUsingInviteCodes.js --inviteCodes ""7ZKZYO", "JH063S""
 *
 * @module executables/oneTimers/signupDetailsUsingInviteCodes
 */
const program = require('commander');

const rootPrefix = '../..',
  SignupsUsingInviteCode = require(rootPrefix + '/lib/user/getData/SignupsUsingInviteCode'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program.option('--inviteCodes <inviteCodes>', 'Invite Codes Array').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/signupDetailsUsingInviteCodes.js --inviteCodes ""7ZKZYO", "JH063S""');
  logger.log('');
  logger.log('');
});

if (!program.inviteCodes) {
  program.help();
  process.exit(1);
}

/**
 * Class to fetch signup details given invite codes.
 *
 * @class GetSignupDetailsUsingInviteCodes
 */
class GetSignupDetailsUsingInviteCodes {
  /**
   * Constructor to fetch signup details given invite codes.
   *
   * @param {string} params.inviteCodes
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.inviteCodes = params.inviteCodes;
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

    logger.log('Invite codes: ', oThis.inviteCodes);

    const inviteCodesArray = basicHelper.commaSeparatedStrToArray(oThis.inviteCodes);

    if (inviteCodesArray.length === 0) {
      logger.error('Invite codes array is empty.');
    }

    await new SignupsUsingInviteCode({ inviteCodes: inviteCodesArray }).perform();
  }
}

new GetSignupDetailsUsingInviteCodes({
  inviteCodes: program.inviteCodes
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
