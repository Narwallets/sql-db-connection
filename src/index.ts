import { DbConnectionPoolOptions, SqlDbConnectionPool } from "./connections/abstract-ConnectionPool";
import { PostgresSqlDbConnectionPool } from './connections/postgresql/postgres-connection-pool';
import { SQLiteDbConnectionPool } from './connections/sqlite/sqlite3-connection-pool';

export * from './connections/abstract-SqlConnection';
export * from './connections/abstract-ConnectionPool';
export * from './builders/build-inserts';
export * from './connections/postgresql/postgres-connection-pool';
export * from './connections/postgresql/postgres-connection';
export * from './connections/sqlite/sqlite3-connection-pool';
export * from './connections/sqlite/sqlite3-connection';
export * from './appTableSchema';

export function createDbConnectionPool(
    options: DbConnectionPoolOptions
): SqlDbConnectionPool {
    switch (options.engine) {
        case 'pg':
            return new PostgresSqlDbConnectionPool(options);
        case 'sq3':
            return new SQLiteDbConnectionPool(options);
        default:
            throw new Error(`Unsupported database engine: ${options.engine}`);
    }
}
