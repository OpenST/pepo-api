/**
 * Class for db kind constants.
 *
 * @class
 */
class DbKind {
  /**
   * Constructor for db kind constants.
   *
   * @constructor
   */
  constructor() {}

  // Db kind start.
  get sqlDbKind() {
    return 'sql';
  }

  get cassandraDbKind() {
    return 'cassandra';
  }
  // Db kind end.
}

module.exports = new DbKind();
