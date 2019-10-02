const rootPrefix = '../../',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image');

/**
 * Class to update video and image statuses.
 *
 * @class UpdateVideoAndImageStatuses
 */
class UpdateVideoAndImageStatuses {
  async perform() {
    const oThis = this;

    return oThis.asyncPerform();
  }

  async asyncPerform() {
    const oThis = this;

    const promisesArray = [oThis.updateVideosTable(), oThis.updateImagesTable()];

    await Promise.all(promisesArray);
  }

  async updateVideosTable() {
    /*
    OLD status values:
      {
        '1': oThis.notCompressedStatus,
        '2': oThis.compressionStartedStatus,
        '3': oThis.compressionDoneStatus,
        '4': oThis.compressionFailedStatus,
        '5': oThis.deletedStatus
      };

    NEW compression_status values:
      {
        '1': oThis.notCompressedStatus,
        '2': oThis.compressionStartedStatus,
        '3': oThis.compressionDoneStatus,
        '4': oThis.compressionFailedStatus
      }

    NEW status values:
      {
        '1': oThis.activeStatus,
        '2': oThis.deletedStatus
      }
     */

    await new VideoModel()
      .update(['status = 1'])
      .where(['status != 5'])
      .fire();

    await new VideoModel()
      .update(['status = 2'])
      .where(['status = 5'])
      .fire();
  }

  async updateImagesTable() {
    /*
    OLD status values:
      {
        '1': oThis.notResized,
        '2': oThis.resizeStarted,
        '3': oThis.resizeDone,
        '4': oThis.resizeFailed
      };

    NEW resize_status values:
      {
        '1': oThis.notResized,
        '2': oThis.resizeStarted,
        '3': oThis.resizeDone,
        '4': oThis.resizeFailed
      }

    NEW status values:
      { '1': oThis.activeStatus }
     */

    await new ImageModel().update(['status = 1']).fire();
  }
}

new UpdateVideoAndImageStatuses()
  .perform()
  .then((response) => {
    console.log(response);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
