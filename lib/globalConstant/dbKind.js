/**
 * Class for db kind constants.
 *
 * @class DbKind
 */
class DbKind {
  // Db kinds start.
  get sqlDbKind() {
    return 'sql';
  }

  get cassandraDbKind() {
    return 'cassandra';
  }
  // Db kinds end.
}

module.exports = new DbKind();
