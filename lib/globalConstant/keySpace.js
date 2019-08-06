const rootPrefix = '../..',
  coreConstant = require(rootPrefix + '/config/coreConstants');

const keySpacePrefix = 'pepo_api',
  keySpaceSuffix = '_' + coreConstant.environment;

class keySpace {
  constructor() {}

  // Cassandra keySpace start

  get mainKeySpace() {
    return keySpacePrefix + keySpaceSuffix;
  }

  // Cassandra keySpace end
}

module.exports = new keySpace();
