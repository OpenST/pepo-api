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







* Clear cache.
```bash
node executables/flush/memcached.js
```