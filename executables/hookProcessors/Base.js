/**
 *
 * Base class for hook processors
 *
 * @module executables/hookProcessors/EmailServiceAPICall
 */

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class HookProcessorsBase {
  /**
   *
   * @constructor
   *
   * @param {Object} params
   * @param {boolean} params.processFailed - boolean tells if this iteration is to retry failed hooks or to process fresh ones
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.processFailed = params.processFailed;
    oThis.currentTimeStamp = Math.round(Date.now() / 1000);

    oThis.lockIdentifier = oThis.currentTimeStamp;

    oThis.hook = null;
    oThis.hooksToBeProcessed = {};
    oThis.successResponse = {};
    oThis.failedHookToBeRetried = {};
    oThis.failedHookToBeIgnored = {};
  }

  /**
   * Perform
   *
   * @returns
   */
  async perform() {
    const oThis = this;

    //acquire lock and fetch the locked hooks
    await oThis._fetchHooksToBeProcessed();

    // Process these Hooks
    await oThis._processHooks();

    // Mark Hooks as processed
    await oThis._updateStatusToProcessed();

    // For hooks which failed, mark them as failed
    await oThis.releaseLockAndUpdateStatusForNonProcessedHooks();
  }

  /**
   * This fetches hooks to be processed
   *
   * @private
   * @returns {Promise<void>}
   */
  async _fetchHooksToBeProcessed() {
    const oThis = this;

    await oThis._acquireLock();
    await oThis._fetchLockedHooks();
  }

  /**
   * Acquire lock
   *
   * @private
   * @returns {Promise<void>}
   */
  async _acquireLock() {
    const oThis = this;

    if (oThis.processFailed) {
      //Acquire Lock on failed hooks
      await oThis._acquireLockOnFailedHooks();
    } else {
      //Acquire lock on fresh hooks
      await oThis._acquireLockOnFreshHooks();
    }
  }

  /**
   * Acquire lock on fresh hooks
   *
   * @returns {Promise<void>}
   * @private
   */
  async _acquireLockOnFreshHooks() {
    const oThis = this;

    let ModelKlass = oThis.hookModelKlass;
    await new ModelKlass().acquireLocksOnFreshHooks();
  }

  /**
   * Acquire lock on failed hooks
   *
   * @returns {Promise<void>}
   * @private
   */
  async _acquireLockOnFailedHooks() {
    const oThis = this;

    let ModelKlass = oThis.hookModelKlass;
    await new ModelKlass().acquireLocksOnFailedHooks();
  }

  /**
   * Fetch locked hooks for processing
   *
   * @returns {Promise<void>}
   */
  async _fetchLockedHooks() {
    const oThis = this;

    let ModelKlass = oThis.hookModelKlass;
    oThis.hooksToBeProcessed = await new ModelKlass().fetchLockedHooks();
  }

  /**
   * Process the fetched hooks
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHooks() {
    const oThis = this;

    for (let hookId in oThis.hooksToBeProcessed) {
      oThis.hook = oThis.hooksToBeProcessed[hookId];

      await oThis._processHook().catch(function(err) {
        oThis.failedHookToBeRetried[oThis.hook.id] = {
          exception: err
        };
      });
    }
  }

  /**
   * Release lock and update status for non processed hooks
   *
   * @returns {Promise<void>}
   */
  async releaseLockAndUpdateStatusForNonProcessedHooks() {
    const oThis = this;

    for (let hookId in oThis.hooksToBeProcessed) {
      if (oThis.failedHookToBeRetried[hookId]) {
        let ModelKlass = oThis.hookModelKlass;
        await new ModelKlass().markFailedToBeRetried();
      }

      if (oThis.failedHookToBeIgnored[hookId]) {
        let ModelKlass = oThis.hookModelKlass;
        await new ModelKlass().markFailedToBeRetried();
      }
    }
  }

  async _updateStatusToProcessed() {
    throw new Error('Sub-class to implement');
  }

  async _processHook() {
    throw new Error('Sub-class to implement');
  }
}
