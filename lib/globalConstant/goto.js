const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

let invertedGotoKinds;

/**
 * Class for for goto constants.
 *
 * @class Goto
 */
class Goto {
  // Share goto kinds start.
  get videoShareGotoKind() {
    return 'video';
  }

  get addEmailScreenGotoKind() {
    return 'addEmailScreen';
  }
  // Share goto kinds end.

  get gotoKinds() {
    const oThis = this;

    return {
      '1': oThis.videoShareGotoKind,
      '2': oThis.addEmailScreenGotoKind
    };
  }

  get invertedGotoKinds() {
    const oThis = this;

    if (invertedGotoKinds) {
      return invertedGotoKinds;
    }

    invertedGotoKinds = util.invert(oThis.gotoKinds);

    return invertedGotoKinds;
  }
}

module.exports = new Goto();
