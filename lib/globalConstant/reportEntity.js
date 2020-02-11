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

  get replyReportEntityKind() {
    return 'reply';
  }

  get channelReportEntityKind() {
    return 'channel';
  }
}

module.exports = new ReportEntityConstant();
