# SQL DB Connection Library

SQL DB Connection is a simple library for building SQL queries and managing database connections in a generic way
supporting PostgreSQL and SQLite. It provides utility functions to streamline database operations,
making it easier to work with SQL in your applications.

## Installation

To install the SQL Utils library, use npm:

```
npm install sql-db-connection
```

## Usage

### Example 1

```typescript
import { getDbConnectionPool } from 'sql-db-utils';

const MY_APP_CODE = "my-app"

export const CREATE_TABLE_APP_DEB_VERSION = `
  CREATE TABLE IF NOT EXISTS app_db_version (
    app_code TEXT,
    version INTEGER,
    date_updated TEXT,
    PRIMARY KEY (app_code)
  )`;

export type AppDbVersionRow = {
  app_code: string;
  version: number;
  date_updated: string;
}


const connPool = getDbConnectionPool({engine:"sq3", database: "local-database.sq3"})
const conn = connPool.getConnection()
await conn.execute(CREATE_TABLE_APP_DEB_VERSION); // if not exists
const result = await conn.query<AppDbVersionRow>(
  `select max(version) version from app_db_version where app_code=$1`,
  [appCode]
);
let version = result.rows[0].version;
if (version == null) { // no rows in version table
  await conn.insertOrReplace("app_db_version",
    {app_code: MY_APP_CODE, version:0, date_updated:isoTruncDate()},
    "app_code" ) // insert or replace using app_code as primary key
  version = 0
}
console.log("DB version:", version)
conn.release()
```

### Example 2

```typescript
  const result = await conn.insert("app_db_version",
    {app_code, version:0, date_updated:isoTruncDate()},
    {onConflictUpdate: { onConflictFields: "app_code" }}) // explicit insert or replace using onConflictUpdate
```

### Execute

```typescript
  const result = await conn.execute("update app_db_version set version=$1 where app_code=$2", [2,'my-app'])
```

## License

This project is licensed under the MIT License