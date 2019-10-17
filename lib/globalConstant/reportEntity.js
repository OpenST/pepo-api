/**
 * Class for report entity constants.
 *
 * @class ReportEntityConstant
 */
class ReportEntityConstant {
  get videoReportEntityKind() {
    return 'video';
  }

  get userReportEntityKind() {
    return 'user';
  }
}

module.exports = new ReportEntityConstant();
