/**
 * Class for transaction types constants.
 *
 * @class TransactionTypesConstants
 */
class TransactionTypesConstants {
  // Transaction types start.
  get userToUserTransactionType() {
    return 'user_to_user';
  }

  get companyToUserTransactionType() {
    return 'company_to_user';
  }

  get userToCompanyTransactionType() {
    return 'user_to_company';
  }

  get allTransactionTypes() {
    const oThis = this;

    return [oThis.userToUserTransactionType, oThis.companyToUserTransactionType, oThis.userToCompanyTransactionType];
  }
  // Transaction types end.
}

module.exports = new TransactionTypesConstants();
