/**
 * This module helps in filtering out at mentions from text and store them.
 *
 * @module lib/FilterOutAtMentions
 */

const rootPrefix = '..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * @class
 *
 * Class to filter out tags from text
 */
class FilterOutAtMentions {
  /**
   * @constructor
   *
   * Constructor of class to filter out text
   *
   * @param text
   */
  constructor(text) {
    const oThis = this;
    oThis.textToFilter = text || '';

    oThis.mentionedNames = [];
    oThis.userNames = {};
  }

  /**
   * Perform operation
   *
   */
  async perform() {
    const oThis = this;

    oThis._filterAtMentions();

    return responseHelper.successWithData({
      text: oThis.textToFilter,
      mentionedNames: oThis.mentionedNames,
      userNames: oThis.userNames
    });
  }

  /**
   * Filter tags from text
   *
   * @private
   */
  _filterAtMentions() {
    const oThis = this;

    oThis.mentionedNames = oThis.textToFilter.match(/@\w+/g);

    if (oThis.mentionedNames) {
      for (let i = 0; i < oThis.mentionedNames.length; i++) {
        const userName = oThis.mentionedNames[i].substring(1).toLowerCase();
        oThis.userNames[userName] = 1;
      }
    }
  }

  /**
   * Add or update at mentions in db
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUpdateAtMentions() {
    const oThis = this;

    // insert into table
  }
}

module.exports = FilterOutAtMentions;
