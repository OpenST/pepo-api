/**
 * Class to backpopulate videos duration
 *
 * @module executables/oneTimers/2020_04_01_populateVideosDuration
 */
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const fs = require('fs');
const Ffmpeg = require('fluent-ffmpeg');
Ffmpeg.setFfmpegPath(ffmpegPath);
Ffmpeg.setFfprobePath(ffprobePath);

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class PopulateVideosDuration {
  constructor() {
    const oThis = this;

    oThis.lastRecordToProcess = 6570;
    oThis.urlPrefix = 'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/videos';
  }

  _fetchVideoDimensions(videoFile) {
    const oThis = this;

    return new Promise(function(onResolve, onReject) {
      // Find dimensions of video
      Ffmpeg.ffprobe(videoFile, function(err, data) {
        let dimensions = { width: 0, height: 0, duration: 0 };
        if (data && data.streams && data.streams[0]) {
          dimensions.width = data.streams[0].width;
          dimensions.height = data.streams[0].height;
          dimensions.duration = Math.round(data.streams[0].duration * 1000);
        }
        onResolve(dimensions);
      });
    });
  }

  async findDimensions(rows) {
    const oThis = this;

    let promises = [];
    for (let vid in rows) {
      const row = rows[vid];
      if (!row.urlTemplate) {
        continue;
      }
      const src = row.urlTemplate.replace('{{s3_vi}}', oThis.urlPrefix).replace('{{s}}', 'original');

      promises.push(
        new Promise(async function(onResolve, onReject) {
          const dimensions = await oThis._fetchVideoDimensions(src).catch();
          if (dimensions) {
            logger.log('Duration fetched for ', row.id, dimensions);
            const extraData = JSON.stringify({ d: dimensions.duration, dp: 30 });
            await new VideoModel()
              .update({ extra_data: extraData })
              .where({ id: row.id })
              .fire();
          }
          onResolve();
        })
      );
    }
    await Promise.all(promises);
  }

  async perform() {
    const oThis = this;

    while (oThis.lastRecordToProcess > 1) {
      let videoIds = [];
      for (let i = oThis.lastRecordToProcess; i > oThis.lastRecordToProcess - 10; i--) {
        videoIds.push(i);
      }
      const videosResp = await new VideoByIdsCache({ ids: videoIds }).fetch();
      if (videosResp.isSuccess()) {
        await oThis.findDimensions(videosResp.data);
        await new VideoByIdsCache({ ids: videoIds }).clear();
      }
      oThis.lastRecordToProcess = oThis.lastRecordToProcess - 10;
      logger.log('One iteration complete sleeping now!!!');
      await basicHelper.sleep(1000);
    }
  }
}

new PopulateVideosDuration()
  .perform()
  .then(function() {
    logger.log('Videos Duration Fetched Successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
