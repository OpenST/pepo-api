const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedEntityKinds = null;

/**
 * Class for curated entities constants.
 *
 * @class CuratedEntityConstants
 */
class CuratedEntityConstants {
  get userEntityKind() {
    return 'users';
  }

  get tagsEntityKind() {
    return 'tags';
  }

  get entityKinds() {
    const oThis = this;

    return {
      '1': oThis.userEntityKind,
      '2': oThis.tagsEntityKind
    };
  }

  get invertedEntityKinds() {
    const oThis = this;

    invertedEntityKinds = invertedEntityKinds || util.invert(oThis.entityKinds);

    return invertedEntityKinds;
  }
}

module.exports = new CuratedEntityConstants();
