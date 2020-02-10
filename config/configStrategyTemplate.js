const rootPrefix = '..',
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

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
      rabbitmqListEntity: {
        entityType: 'object',
        entitiesPresent: {
          username: 'usernameEntity',
          password: 'passwordEntity',
          heartbeats: 'heartbeatsEntity',
          clusters: 'multipleClustersEntity'
        }
      },
      multipleClustersEntity: {
        entityType: 'array',
        entitiesPresent: 'clusterEntity'
      },
      clusterEntity: {
        entityType: 'object',
        entitiesPresent: {
          id: 'socketRabbbitMqIdEntity',
          host: 'hostEntity',
          port: 'portEntity',
          clusterNodes: 'clusterNodesEntity'
        }
      },
      websocketEntity: {
        entityType: 'object',
        entitiesPresent: {
          wsAuthSalt: 'saltEntity',
          endpoint: 'hostEntity',
          port: 'portEntity',
          protocol: 'protocolEntity'
        }
      },
      cassandraEntity: {
        entityType: 'object',
        entitiesPresent: {
          username: 'usernameEntity',
          password: 'passwordEntity',
          contactPoints: 'contactPointsEntity',
          localDataCenter: 'localDataCenterEntity'
        }
      },
      firebaseEntity: {
        entityType: 'object',
        entitiesPresent: {
          type: 'typeEntity',
          projectId: 'projectIdEntity',
          privateKeyId: 'privateKeyIdEntity',
          privateKey: 'privateKeyEntity',
          clientEmail: 'clientEmailEntity',
          clientId: 'clientIdEntity',
          authUri: 'authUriEntity',
          tokenUri: 'tokenUriEntity',
          authProviderx509CertUrl: 'authProviderx509CertUrlEntity',
          clientx509CertUrl: 'clientx509CertUrlEntity',
          databaseURL: 'databaseURLEntity'
        }
      },
      typeEntity: {
        entityType: 'string'
      },
      projectIdEntity: {
        entityType: 'string'
      },
      privateKeyIdEntity: {
        entityType: 'string'
      },
      privateKeyEntity: {
        entityType: 'string'
      },
      clientEmailEntity: {
        entityType: 'string'
      },
      clientIdEntity: {
        entityType: 'string'
      },
      authUriEntity: {
        entityType: 'string'
      },
      tokenUriEntity: {
        entityType: 'string'
      },
      authProviderx509CertUrlEntity: {
        entityType: 'string'
      },
      clientx509CertUrlEntity: {
        entityType: 'string'
      },
      databaseURLEntity: {
        entityType: 'string'
      },
      socketRabbbitMqIdEntity: {
        entityType: 'string'
      },
      userEntity: {
        entityType: 'string'
      },
      saltEntity: {
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
      },
      protocolEntity: {
        entityType: 'string'
      },
      contactPointsEntity: {
        entityType: 'array',
        entitiesPresent: 'contactPointEntity' // For an array entity this array will contain entity types which that array will hold.
      },
      contactPointEntity: {
        entityType: 'string'
      },
      localDataCenterEntity: {
        entityType: 'string'
      }
    };
  }

  get rootLevelEntities() {
    return {
      [configStrategyConstants.memcached]: 'memcachedEntity',
      [configStrategyConstants.bgJobRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.notificationRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.webhookPreProcessorRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.pepoMobileEventRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.pixelRabbitmq]: 'rabbitmqEntity',
      [configStrategyConstants.socketRabbitmq]: 'rabbitmqListEntity',
      [configStrategyConstants.websocket]: 'websocketEntity',
      [configStrategyConstants.cassandra]: 'cassandraEntity',
      [configStrategyConstants.firebase]: 'firebaseEntity'
    };
  }
}

module.exports = new ConfigStrategyTemplate();
