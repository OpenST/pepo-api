/**
 * Module for pagination related global constants.
 *
 * @module lib/globalConstant/pagination
 */

/**
 * Class for pagination related global constants.
 *
 * @class Pagination
 */
class Pagination {
  get paginationIdentifierKey() {
    return 'pagination_identifier';
  }

  get nextPagePayloadKey() {
    return 'next_page_payload';
  }

  get totalNoKey() {
    return 'total_no';
  }

  get hasNextPage() {
    return 'has_next_page';
  }

  get minUserListPageSize() {
    return 1;
  }

  get maxUserListPageSize() {
    return 10;
  }

  get defaultUserListPageSize() {
    return 10;
  }

  get defaultUserFeedPageSize() {
    return 10;
  }
}

module.exports = new Pagination();
