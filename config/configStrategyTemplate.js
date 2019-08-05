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
      inMemoryCacheEntity: {
        entityType: 'object',
        entitiesPresent: {
          engine: 'engineEntity',
          defaultTtl: 'defaultTtlEntity',
          namespace: 'namespaceEntity',
          consistentBehavior: 'consistentBehaviorEntity'
        }
      },
      rabbitmqEntity: {
        entityType: 'object',
        entitiesPresent: {
          username: 'usernameEntity',
          password: 'passwordEntity',
          host: 'hostEntity',
          port: 'portEntity',
          heartbeats: 'heartbeatsEntity',
          clusterNodes: 'clusterNodesEntity'
        }
      },
      redshiftEntity: {
        entityType: 'object',
        entitiesPresent: {
          user: 'userEntity',
          database: 'databaseEntity',
          password: 'passwordEntity',
          port: 'portEntity',
          host: 'hostEntity'
        }
      },

      userEntity: {
        entityType: 'string'
      },
      databaseEntity: {
        entityType: 'string'
      },
      heartbeatsEntity: {
        entityType: 'string'
      },
      clusterNodesEntity: {
        entityType: 'array',
        entitiesPresent: 'clusterNodeEntity'
      },
      clusterNodeEntity: {
        entityType: 'string'
      },
      hostEntity: {
        entityType: 'string'
      },
      portEntity: {
        entityType: 'string'
      },
      passwordEntity: {
        entityType: 'string'
      },
      usernameEntity: {
        entityType: 'string'
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
      namespaceEntity: {
        entityType: 'string'
      }
    };
  }

  get rootLevelEntities() {
    return {
      [configStrategyConstants.memcached]: 'memcachedEntity',
      [configStrategyConstants.bgJobRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.notificationRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.socketRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.redshift]: 'redshiftEntity'
    };
  }
}

module.exports = new ConfigStrategyTemplate();
