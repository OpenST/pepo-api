const rootPrefix = '..',
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for config strategy template.
 *
 * @class ConfigStrategyTemplate
 */
class ConfigStrategyTemplate {
  get entitiesMap() {
    return {
      memcachedEntity: {
        entityType: 'object',
        entitiesPresent: {
          engine: 'engineEntity',
          servers: 'serversEntity',
          defaultTtl: 'defaultTtlEntity',
          consistentBehavior: 'consistentBehaviorEntity'
        }
      },
      engineEntity: {
        entityType: 'string'
      },
      serversEntity: {
        entityType: 'array',
        entitiesPresent: 'serverEntity' // For an array entity this array will contain entity types which that array will hold.
      },
      serverEntity: {
        entityType: 'string'
      },
      defaultTtlEntity: {
        entityType: 'number'
      },
      consistentBehaviorEntity: {
        entityType: 'string'
      },

      inMemoryCacheEntity: {
        entityType: 'object',
        entitiesPresent: {
          engine: 'engineEntity',
          defaultTtl: 'defaultTtlEntity',
          namespace: 'namespaceEntity',
          consistentBehavior: 'consistentBehaviorEntity'
        }
      },
      namespaceEntity: {
        entityType: 'string'
      }
    };
  }

  get rootLevelEntities() {
    return {
      [configStrategyConstants.memcached]: 'memcachedEntity',
      [configStrategyConstants.inMemoryCache]: 'inMemoryCacheEntity'
    };
  }
}

module.exports = new ConfigStrategyTemplate();
