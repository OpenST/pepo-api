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

  get minTagListPageSize() {
    return 1;
  }

  get maxUserListPageSize() {
    return 20;
  }

  get maxTagListPageSize() {
    return 20;
  }

  get defaultUserListPageSize() {
    return 20;
  }

  get defaultTagListPageSize() {
    return 10;
  }

  get minUserFeedPageSize() {
    return 1;
  }

  get maxUserFeedPageSize() {
    return 10;
  }

  get defaultUserFeedPageSize() {
    return 10;
  }

  get minPublicFeedPageSize() {
    return 1;
  }

  get maxPublicFeedPageSize() {
    return 10;
  }

  get defaultPublicFeedPageSize() {
    return 10;
  }
}

module.exports = new Pagination();
