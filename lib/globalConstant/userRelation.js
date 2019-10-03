const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let relationsHash, invertedRelationsHash;

/**
 * Class for user relation constants.
 *
 * @class
 */
class UserRelationConstants {
  /**
   * Constructor for user relation constants.
   *
   * @constructor
   */
  constructor() {}

  get blockedByUser1Relation() {
    return 'blocked_by_user1';
  }

  get blockedByUser2Relation() {
    return 'blocked_by_user2';
  }

  get relations() {
    const oThis = this;

    relationsHash = relationsHash || {
      '1': oThis.blockedByUser1Relation,
      '2': oThis.blockedByUser2Relation
    };

    return relationsHash;
  }

  get invertedRelations() {
    const oThis = this;

    invertedRelationsHash = invertedRelationsHash || util.invert(oThis.relations);

    return invertedRelationsHash;
  }
}

module.exports = new UserRelationConstants();
