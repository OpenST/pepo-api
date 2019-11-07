const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds, longToShortNamesMap, longToShortNamesForEntityKindsMap;

/**
 * Class for text include constants.
 *
 * @class TextInclude
 */
class TextInclude {
  get linkEntityKind() {
    return 'LINK';
  }

  get tagEntityKind() {
    return 'TAG';
  }

  get userEntityKind() {
    return 'USER';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.linkEntityKind,
      '2': oThis.tagEntityKind,
      '3': oThis.userEntityKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get shortToLongNamesMap() {
    return {
      text_id: 'textId',
      entity_identifier: 'entityIdentifier',
      replaceable_text: 'replaceableText'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }

  get shortToLongNamesMapForEntityKind() {
    const oThis = this;

    return {
      [oThis.linkEntityKind]: 'l',
      [oThis.tagEntityKind]: 't',
      [oThis.userEntityKind]: 'u'
    };
  }

  get longToShortNamesMapForEntityKind() {
    const oThis = this;

    longToShortNamesForEntityKindsMap =
      longToShortNamesForEntityKindsMap || util.invert(oThis.shortToLongNamesMapForEntityKind);

    return longToShortNamesForEntityKindsMap;
  }
}

module.exports = new TextInclude();
