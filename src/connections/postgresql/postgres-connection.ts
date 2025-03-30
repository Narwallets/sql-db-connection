import { SqlConnection } from '../abstract-SqlConnection';
import { SupportedDbEngines } from '../abstract-ConnectionPool';
import { PoolClient } from 'pg';
import { QueryResult, QueryResultRow } from '../..';

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
