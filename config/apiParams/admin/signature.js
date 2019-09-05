const rootPrefix = '../../..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

const adminSignature = {
  [apiName.adminUserSearch]: {
    mandatory: [
      {
        parameter: 'search_by_admin',
        validatorMethods: ['validateBoolean']
      }
    ],
    optional: [
      {
        parameter: 'q',
        validatorMethods: ['validateString']
      },
      {
        parameter: paginationConstants.paginationIdentifierKey,
        validatorMethods: ['validateString', 'validatePaginationIdentifier']
      }
    ]
  },
  [apiName.adminUserApprove]: {
    mandatory: [
      {
        parameter: 'user_ids',
        validatorMethods: ['validateArray']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminUserBlock]: {
    mandatory: [
      {
        parameter: 'user_ids',
        validatorMethods: ['validateArray']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminDeleteVideo]: {
    mandatory: [
      {
        parameter: 'video_id',
        validatorMethods: ['validateNonZeroInteger']
      },
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminLogin]: {
    mandatory: [
      {
        parameter: 'email',
        validatorMethods: ['isValidEmail']
      },
      {
        parameter: 'password',
        validatorMethods: ['validatePassword']
      }
    ],
    optional: []
  },
  [apiName.loggedInAdmin]: {
    mandatory: [
      {
        parameter: 'current_admin',
        validatorMethods: ['validateNonEmptyObject']
      }
    ],
    optional: []
  },
  [apiName.adminWhitelistUser]: {
    mandatory: [
      {
        parameter: 'invite_id',
        validatorMethods: ['validateNonZeroInteger']
      }
    ],
    optional: []
  }
};

module.exports = adminSignature;
