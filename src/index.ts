import { DbConnectionPoolOptions, SqlDbConnectionPool, SupportedDbEngines } from './connections/abstract-sql-db-pool-and-connection';
import { PostgresSqlDbConnectionPool } from './connections/postgresql/postgres-connection';
import { SQLiteDbConnectionPool } from './connections/sqlite/sqlite-connection';

export * from './connections/abstract-sql-db-pool-and-connection';
export * from './builders/build-inserts';
export * from './connections/postgresql/postgres-connection';
export * from './connections/sqlite/sqlite-connection';

export function getDbConnectionPool(
    dbEngine: SupportedDbEngines,
    options: DbConnectionPoolOptions
): SqlDbConnectionPool {
    if (dbEngine === 'pg') {
        return new PostgresSqlDbConnectionPool(options);
    } else if (dbEngine === 'sq3') {
        return new SQLiteDbConnectionPool(options);
    } else {
        throw new Error(`Unsupported database engine: ${dbEngine}`);
    }
}
