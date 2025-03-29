import { Pool, QueryResult, QueryResultRow, PoolClient } from 'pg';
import { SqlConnection, SqlDbConnectionPool, SupportedDbEngines } from '../abstract-sql-db-pool-and-connection';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class PostgresSqlDbConnectionPool extends SqlDbConnectionPool {

    public pool: Pool | undefined = undefined;

    init(user?: string, password?: string) {

        if (this.options.readonly !== undefined) {
            throw new Error("readonly is not supported for Postgres");
        }

        // get the certificate file from ~/.config/caCertificateFile
        if (!this.options.caCertificateFile) throw new Error('missing caCertificateFile');
        const certificatePath = join(homedir(), ".config", this.options.caCertificateFile)
        let certificateText
        try {
            certificateText = readFileSync(certificatePath).toString()
        } catch (err) {
            throw new Error(`Err reading caCertificateFile from ${certificatePath}, ${JSON.stringify(err)}`);
        }
        // crate a pool
        this.pool = new Pool({
            ...this.options,
            user,
            password,
            max: 20, // Max number of clients in the pool
            idleTimeoutMillis: 20000, // Close idle clients after 20 seconds
            connectionTimeoutMillis: 10000, // Timeout if no connection in 10 seconds
            ssl: {
                rejectUnauthorized: false,
                ca: certificateText,
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

// is created by the pool
export class PostgresConnection extends SqlConnection {

    constructor(
        public poolClient: PoolClient
    ) {
        super();
    }

    get dbEngine(): SupportedDbEngines { return "pg" }

    release(): void {
        this.poolClient.release();
    }

    async query<RowType extends QueryResultRow>(query: string, params: any[]): Promise<QueryResult<RowType>> {
        return this.poolClient.query(query, params)
    }

}
