/**
 * Class for for Mysql Error Constants.
 *
 * @class MysqlErrors
 */
class MysqlErrors {
  get duplicateError() {
    return 'ER_DUP_ENTRY';
  }
}

module.exports = new MysqlErrors();
