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

## Installation Steps

* Create the main db and create schema_migrations table.
```bash
node db/seed.js
```

* Run all pending migrations.
```bash
node db/migrate.js
```

* Clear cache.
```bash
node devops/exec/flushMemcache.js
```