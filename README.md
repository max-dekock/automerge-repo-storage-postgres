# PostgresQL store for Automerge Repo

This module implements a PostgresQL storage adapter for [Automerge Repo](https://github.com/automerge/automerge-repo).

## Example usage

```js
import { PostgresStorageAdapter } from "automerge-repo-storage-postgres";
import { Repo } from "@automerge/automerge-repo";

const repo = new Repo({
    network: [],
    storage: new PostgresStorageAdapter("my_table")
});
```

## Database configuration

By default, the database configuration is read from [environment variables](https://www.postgresql.org/docs/9.1/libpq-envars.html). To specify configuration parameters programmatically, pass an instance of [pg.Pool](https://node-postgres.com/apis/pool).

```js
import pg from "pg";
import { PostgresStorageAdapter } from "automerge-repo-storage-postgres";
import { Repo } from "@automerge/automerge-repo";

const pool = new pg.Pool({
    host: "my_server",
    db: "my_db",
    user: "my_user",
    password: "hunter2",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
const pg_storage = new PostgresStorageAdapter("my_table", pool);
const repo = new Repo({
    network: []
    storage: pg_storage
});
```

## Table layout

The storage table should have the following columns:

```sql
CREATE TABLE my_table (
    key ARRAY[BYTEA] PRIMARY KEY,
    value BYTEA NOT NULL
);
```

Any additional columns will be ignored.