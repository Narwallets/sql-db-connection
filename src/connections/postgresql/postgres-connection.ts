import { QueryResult, QueryResultRow, PoolClient } from 'pg';
import { SqlConnection } from '../abstract-SqlConnection';
import { SupportedDbEngines } from '../abstract-ConnectionPool';

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

    async execute<RowType extends QueryResultRow>(query: string, params?: any[]): Promise<QueryResult<RowType>> {
        return this.poolClient.query(query, params || [])
    }

}
