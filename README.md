# pepo-api

* Requirements
    
    You will need following for development environment setup.
    - [MySQL](https://www.mysql.com/downloads/)
    - [Memcached](https://memcached.org/)

* Install all the packages.
```
rm -rf node_modules
rm -rf package-lock.json
npm install
```

* Source the ENV vars.
```
source set_env_vars.sh
```

* Start the MySQL server.
```
mysql.server start
```

* Start Memcached
```
memcached -p 11211 -d
```

# Installation Steps

## Run DB Migrations

* Create the main db and create schema_migrations table.
```bash
node db/seed.js
```

* Run all pending migrations.
```bash
node db/migrate.js
```

* [Only Development] Create `infra` database and `error_logs` table.
```bash
   source set_env_vars.sh
   node executables/oneTimers/createErrorLogsTable.js
```

## Seed config strategy

* Global Configs Seed
```bash
    source set_env_vars.sh
    node devops/exec/configStrategy.js --add-configs

    # Note: For staging and production follow help
```

* Activate Global Configs
```bash
    source set_env_vars.sh
    node devops/exec/configStrategy.js --activate-configs
```

* Clear cache.
```bash
node devops/exec/flushMemcache.js
```

## Seed tables.

* Seed Tokens Table.
```bash
node executables/oneTimers/seedTokensTable.js --apiKey "__ABCD" --apiSecret "__WXYZ"
```

## Subscribe for OST webhooks
```bash
node executables/oneTimers/webhooksSubscription.js
```

## Insert webhooks secret

Note: Get the secret and webhooks id from above run(subscribe webhooks).

```bash 
node executables/oneTimers/insertWebhooksSecret.js --webhooksSecret "__WXYZ" --webhooksId "__ABCD"
```

* Seed Gif categories
```bash
source set_env_vars.sh
node executables/oneTimers/populateGifCategories.js
```