import { readFileSync } from 'fs';
import { Pool } from 'pg';
import { SqlDbConnectionPool } from '../abstract-ConnectionPool';
import { SqlConnection } from '../abstract-SqlConnection';
import { PostgresConnection } from './postgres-connection';


export class PostgresSqlDbConnectionPool extends SqlDbConnectionPool {

    public pool: Pool | undefined = undefined;

    init(password?: string) {

        // options.readonly flag is only for SQLite
        if (this.options.readonly !== undefined) throw new Error("options.readonly is not supported for Postgres");
        // we need a certificate file
        if (!this.options.caCertificateFile) throw new Error('missing caCertificateFile');
        // crate a pool
        this.pool = new Pool({
            ...this.options,
            password,
            max: 20, // Max number of clients in the pool
            idleTimeoutMillis: 20000, // Close idle clients after 20 seconds
            connectionTimeoutMillis: 10000, // Timeout if no connection in 10 seconds
            ssl: {
                rejectUnauthorized: false,
                ca: readFileSync(this.options.caCertificateFile).toString(),
            },
        });

    }

    async end(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = undefined;
        }
    }

    async getConnection(): Promise<SqlConnection> {
        const pgPoolClient = await this.pool!.connect();
        return new PostgresConnection(pgPoolClient);
    }
}
