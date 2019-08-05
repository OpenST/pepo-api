# pepo-api

* Requirements
    
    You will need following for development environment setup.
    - [MySQL](https://www.mysql.com/downloads/)
    - [Memcached](https://memcached.org/)
    - [RabbitMQ](https://www.rabbitmq.com/download.html)

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

* Start RabbitMQ
```
    brew services start rabbitmq
```

## Installation Steps

### Run DB Migrations

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

### Seed config strategy

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

### Seed tables.

* Seed Tokens Table.
```bash
    node executables/oneTimers/seedTokensTable.js --apiKey "803ee2a07554b94d80fb4ba4eb08229c" --apiSecret "66fc5bce904f83a74aba10469505cd5ac51dfc886fc747ecbfba3fea254d3006"
```

* Seed Ost Price Points Table.
```bash
    node executables/oneTimers/seedOstPricePointsTable.js --apiKey "803ee2a07554b94d80fb4ba4eb08229c" --apiSecret "66fc5bce904f83a74aba10469505cd5ac51dfc886fc747ecbfba3fea254d3006"

```

* [Only Development] Seed the cron processes using this script.
```bash
    source set_env_vars.sh
    node lib/cronProcess/cronSeeder.js
```

* Seed tables for profile
```bash
   node tempSeeder.js
```

### Subscribe for OST webhooks
```bash
    node executables/oneTimers/webhooksSubscription.js
```

### Insert webhooks secret
Note: Get the webhooks id from above run(subscribe webhooks). Secret has to be obtained from developer page

```bash 
    node executables/oneTimers/insertWebhooksSecret.js --webhooksSecret "__WXYZ" --webhooksId "__ABCD"
```

### Seed Gif categories
```bash
    source set_env_vars.sh
    node executables/oneTimers/populateGifCategories.js
```

### Background jobs
* Factory process for processing background jobs
```bash
    # note: for topics to subscribe and prefetch count, please see params column of the cron_processes table
    source set_env_vars.sh
    node executables/bgJobProcessor/Processor.js --cronProcessId 3
```

* Enqueue background job
```bash
    source set_env_vars.sh
    > node
        let BgJob = require('./lib/BgJob');
        BgJob.enqueue("bg.p1.example", {"k1": "v1"});
```