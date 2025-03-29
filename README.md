# SQL Utils Library

SQL Utils is a simple library for building SQL queries and managing database connections in a generic way
supporting PostgreSQL and SQLite. It provides utility functions to streamline database operations,
making it easier to work with SQL in your applications.

## Installation

To install the SQL Utils library, use npm:

```
npm install sql-db-utils
```

## Usage

### Importing the Library

You can import the library in your TypeScript or JavaScript files as follows:

```typescript
import { getDbConnectionPool } from 'sql-db-utils';

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


const connPool = getDbConnectionPool("sq3", { database: "local-database.sq3"})
const conn = connPool.getConnection()
await conn.execute(CREATE_TABLE_APP_DEB_VERSION); // if not exists
const result = await conn.query<AppDbVersionRow>(
  `select max(version) version from app_db_version where app_code=$1`,
  [appCode]
);
let version = result.rows[0].version;
if (version == null) { // no rows in version table
  await conn.execute(
    `insert into app_db_version(app_code,version,date_updated) values ($1,$2)`,
    [appCode, isoTruncDate()]);
  version = 1
}
console.log("DB version:", version)
conn.release()
```

### QueryBuilder

The `QueryBuilder` class allows you to construct SQL queries programmatically. Here’s an example of how to use it:

```typescript
const queryBuilder = new QueryBuilder();
const query = queryBuilder.select('*').from('users').where('id = 1').build();
console.log(query); // Outputs: SELECT * FROM users WHERE id = 1;
```

### PostgresConnection

To connect to a PostgreSQL database, use the `PostgresConnection` class:

```typescript
const postgresConnection = new PostgresConnection({
  host: 'localhost',
  user: 'your_user',
  password: 'your_password',
  database: 'your_database'
});

await postgresConnection.connect();
// Execute queries...
await postgresConnection.disconnect();
```

### SQLiteConnection

For SQLite, you can use the `SQLiteConnection` class:

```typescript
const sqliteConnection = new SQLiteConnection('path/to/database.db');

await sqliteConnection.connect();
// Execute queries...
await sqliteConnection.disconnect();
```

### Utility Functions

The `dbUtils` module provides various utility functions for database operations:

```typescript
const formattedQuery = dbUtils.formatQuery('SELECT * FROM users WHERE id = ?', [1]);
console.log(formattedQuery); // Outputs: SELECT * FROM users WHERE id = 1
```

## API Reference

- **QueryBuilder**
  - `select(columns: string[]): QueryBuilder`
  - `from(table: string): QueryBuilder`
  - `where(condition: string): QueryBuilder`
  - `build(): string`

- **PostgresConnection**
  - `connect(): Promise<void>`
  - `disconnect(): Promise<void>`
  - `execute(query: string): Promise<any>`

- **SQLiteConnection**
  - `connect(): Promise<void>`
  - `disconnect(): Promise<void>`
  - `execute(query: string): Promise<any>`

- **dbUtils**
  - `formatQuery(query: string, params: any[]): string`

## License

This project is licensed under the MIT License. See the LICENSE file for more details.