# pepo-api

## Pre-requisites for setting up environment

* Start [MySQL](https://www.mysql.com/downloads/)
```bash
  mysql.server start
```

* Start [Memcached](https://memcached.org/)
```bash
  memcached -p 11211 -d
```

* Start [RabbitMQ](https://www.rabbitmq.com/download.html)
```bash
  brew services start rabbitmq
```

* Install and start [Cassandra](https://cassandra.apache.org/)
    - Install Cassandra
    ```bash
      brew install cassandra
    ```

    - Open /usr/local/etc/cassandra/cassandra.yaml file. Search for the following string 'authenticator: AllowAllAuthenticator'. Replace 'AllowAllAuthenticator' with 'PasswordAuthenticator'. Start cassandra.
    ```bash
      brew services start cassandra
    ```
    
* Refer [Pepo-Tracker](https://github.com/pepotech/pepo-tracker) readme for setting it up.

* [Only Development] Include following server block in `/usr/local/etc/nginx/nginx.conf`
```bash
   server {
               listen       8080;
               server_name  pepodev.com;
   
               location /api/ {
                       proxy_cookie_domain localhost pepodev.com;
                       proxy_pass http://pepodev.com:3000/api/;
               }
               
               location /webhooks/ {
                       proxy_cookie_domain localhost pepodev.com;
                       proxy_pass http://pepodev.com:3000/webhooks/;
               }               
   
               location /admin/ {
                       proxy_cookie_domain localhost pepodev.com;
                       proxy_pass http://pepodev.com:4000/admin/;
               }

               location /builtAssets {
                        proxy_cookie_domain localhost pepodev.com;
                        proxy_pass http://pepodev.com:4000;
               }
   
               location / {
                       proxy_cookie_domain localhost pepodev.com;
                       proxy_pass http://pepodev.com:5000;
               }
       }

   server {
                  listen       8080;
                  server_name  store.pepodev.com;

                  location /api/ {
                       proxy_set_header        Host $host;
                       proxy_cookie_domain localhost pepodev.com;
                       proxy_pass http://store.pepodev.com:3000/api/;
                  }

                  location / {
                       proxy_set_header        Host $host;
                       proxy_cookie_domain localhost pepodev.com;
                       proxy_pass http://store.pepodev.com:5000;
                  }
          }
```

* [Only Development] Include following line in `/etc/hosts` file
```bash
    127.0.0.1       pepodev.com
    127.0.0.1       store.pepodev.com
```

* [Only Development] Reload nginx
```bash
    sudo nginx -s reload
```

## Install all the dependency npm packages
```bash
  rm -rf node_modules
  rm -rf package-lock.json
  npm install
```

## Seed DB
* Create the main db and create schema_migrations table.
```bash
  node db/seed.js
```

* Run selective migrations
```bash
  source set_env_vars.sh

  # create config_strategies table
  node db/migrate.js --up 1561038407695
  
  # create global_salts table
  node db/migrate.js --up 1561037631832
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

## Run DB Migrations

* Run all pending migrations.
```bash
  node db/migrate.js
```

* [Only Development] Create `infra` database and `error_logs` table.
```bash
  source set_env_vars.sh
  node executables/oneTimers/createErrorLogsTable.js
```

## Seed ost platform specific info

* Seed Tokens Table.
```bash
  node executables/oneTimers/seedTokensTable.js --apiKey "803ee2a07554b94d80fb4ba4eb08229c" --apiSecret "66fc5bce904f83a74aba10469505cd5ac51dfc886fc747ecbfba3fea254d3006"
```

* Update Utility Branded Token In Tokens Table (execute this script for first time only).
```bash
  node executables/oneTimers/UpdateUtilityBrandedTokenInTokensTable.js --apiKey "803ee2a07554b94d80fb4ba4eb08229c" --apiSecret "66fc5bce904f83a74aba10469505cd5ac51dfc886fc747ecbfba3fea254d3006"
```

* Subscribe for OST web-hooks
```bash
  node executables/oneTimers/webhooksSubscription.js
```

* Insert web-hook secret
Note: Get the webhooks id from above run(subscribe webhooks). Secret has to be obtained from developer page.
```bash 
  node executables/oneTimers/insertWebhooksSecret.js --webhooksSecret "__WXYZ" --webhooksId "__ABCD"
```

* Seed Ost Price Points Table.
```bash
  node executables/oneTimers/seedOstPricePointsTable.js --apiKey "803ee2a07554b94d80fb4ba4eb08229c" --apiSecret "66fc5bce904f83a74aba10469505cd5ac51dfc886fc747ecbfba3fea254d3006"
```

## Start cron processes
* [Only Development] Seed the cron processes using this script.
```bash
  source set_env_vars.sh
  node lib/cronProcess/cronSeeder.js
```

* Factory process for processing background jobs
```bash
  # note: for topics to subscribe and prefetch count, please see params column of the cron_processes table
  source set_env_vars.sh
  node executables/rabbitMqSubscribers/bgJobProcessor.js --cronProcessId 3
```
* Factory process for processing notification jobs.
```bash
  # note: for topics to subscribe and prefetchcount, please see params column of the cron_processes table
  source set_env_vars.sh
  node executables/rabbitMqSubscribers/notificationJobProcessor.js --cronProcessId 4
```

* Factory process for processing pepo mobile event jobs.
```bash
  # note: for topics to subscribe and prefetchcount, please see params column of the cron_processes table
  source set_env_vars.sh
  node executables/rabbitMqSubscribers/pepoMobileEventJobProcessor.js --cronProcessId 5
```

* Factory process for processing pixels jobs.
```bash
  # note: for topics to subscribe and prefetchcount, please see params column of the cron_processes table
  source set_env_vars.sh
  node executables/rabbitMqSubscribers/pixelJobProcessor.js --cronProcessId 6
```


* Cron for processing the cloudfront cache invalidation after video delete
```bash
  # note: for topics to subscribe and prefetchcount, please see params column of the cron_processes table
  source set_env_vars.sh
  node executables/rabbitMqSubscribers/cdnCacheInvalidationProcessor.js --cronProcessId 6
```

* Push Notifications related crons.
```bash
  # Hook processor cron
  source set_env_vars.sh
  node executables/pushNotification/hookProcessor.js --cronProcessId 8
  # Aggragated push notifcations cron
  source set_env_vars.sh
  node executables/pushNotification/aggregator.js --cronProcessId 9
```

* Factory process for processing webhook pre process jobs.
```bash
  # note: for topics to subscribe and prefetchcount, please see params column of the cron_processes table
  source set_env_vars.sh
  node executables/rabbitMqSubscribers/webhookJobPreProcessor.js --cronProcessId 10
```

* Cron for sending webhook events
```bash
  # note: for topics to subscribe and prefetchcount, please see params column of the cron_processes table
  source set_env_vars.sh
  node executables/webhookProcessor.js --cronProcessId 11
```

## Web-sockets
* Start web-socket server.
```bash
  source set_env_vars.sh
  node websocket-server.js
```

## Seed locations table
```bash
    source set_env_vars.sh
    node executables/oneTimers/locationSeeder.js
```

## Helper commands

* Clear cache.
```bash
  node devops/exec/flushMemcache.js
```

## Create admin 
```bash
  R = require('./app/services/admin/ResetPassword.js')
  r = new R({ email: 'pepo@ost.com', name: 'Pepo Api', slack_id: 'ABC123'})
  r.perform().then(console.log)
```

* Source the ENV vars.
```bash
  source set_env_vars.sh
```
