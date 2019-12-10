const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

let tagIds = [],
  userIds = [];

let MAXNUMBER = 100000000;

let tagInsertQuery = 'SELECT * FROM `curated_entities`',
  userInsertQuery = 'SELECT * FROM `curated_entities`';

const curatedTagIdsString = process.env.PA_CURATED_TAG_IDS;
const curatedUserIdsString = process.env.PA_USER_SEARCH_CURATED_USER_IDS;

if (curatedTagIdsString && curatedTagIdsString.length > 0) {
  tagIds = JSON.parse(curatedTagIdsString);
  tagInsertQuery =
    'INSERT INTO `curated_entities` (`entity_id`, `entity_kind`, `position`, `created_at`, `updated_at`) VALUES';
  for (let index = 0; index < tagIds.length; index++) {
    let position = MAXNUMBER / 2 + 10000 * index;
    console.log('position----', position);
    tagInsertQuery += `(${tagIds[index]}, 2, ${position}, ${Math.floor(Date.now() / 1000)}, ${Math.floor(
      Date.now() / 1000
    )})`;
    if (index !== tagIds.length - 1) {
      tagInsertQuery += ',';
    }
  }
}

if (curatedUserIdsString && curatedUserIdsString.length > 0) {
  userIds = JSON.parse(curatedUserIdsString);
  userInsertQuery =
    'INSERT INTO `curated_entities` (`entity_id`, `entity_kind`, `position`, `created_at`, `updated_at`) VALUES';
  for (let index = 0; index < userIds.length; index++) {
    let position = MAXNUMBER / 2 + 10000 * index;
    console.log('position----', position);
    userInsertQuery += `(${userIds[index]}, 1, ${position}, ${Math.floor(Date.now() / 1000)}, ${Math.floor(
      Date.now() / 1000
    )})`;
    if (index !== userIds.length - 1) {
      userInsertQuery += ',';
    }
  }
}

console.log('tagInsertQuery----', tagInsertQuery);
console.log('userInsertQuery----', userInsertQuery);

const createCuratedEntitiesTable = {
  dbName: dbName,
  up: [tagInsertQuery, userInsertQuery],
  down: [],
  dbKind: dbKind
};

module.exports = createCuratedEntitiesTable;
