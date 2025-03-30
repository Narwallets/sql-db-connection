import sqlite3 from 'sqlite3';
import * as promisified from './sqlite3-promisified';
import { SqlConnection } from '../abstract-SqlConnection';
import { SupportedDbEngines } from "../abstract-ConnectionPool";
import { QueryResult, QueryResultRow } from 'pg';

function replaceDollarSignWithQuestionMark(query: string): string {
    return query.replace(/\$/g, '?');
}

/**
 * instances are created by the pool
 * Represents a connection to an SQLite database, implementing the `SqlConnection` interface.
 * Provides methods to connect, disconnect, execute queries, and retrieve data from the database.
 */
export class SQLiteConnection extends SqlConnection {

    // called by the pool
    constructor(
        public db: sqlite3.Database
    ) {
        super();
    }

    get dbEngine(): SupportedDbEngines { return "sq3" }

    /**
     * Releases the database connection.
     *
     * @returns A promise that resolves when the connection is successfully released.
     */
    release(): Promise<void> {
        return promisified.close(this.db)
    }

    /**
     * Executes a query and retrieves rows from the SQLite database.
     *
     * @typeParam RowType - The type of the rows returned by the query.
     * @param query - The SQL query string to execute.
     * @param params - The parameters to bind to the query.
     * @returns Promise<{
     *      command: string;
     *      rowCount: number | null;
     *      oid: number;
     *      fields: FieldDef[];
     *      rows: RowType[];
     * }
     *
     * @throws An error if the query fails or the database is not connected.
     */
    async query<RowType extends QueryResultRow>(query: string, params: any[]): Promise<QueryResult<RowType>> {
        let rows = await promisified.query(this.db, replaceDollarSignWithQuestionMark(query), params);
        return {
            rows,
            command: query,
            rowCount: rows.length,
        } as QueryResult<RowType>;
    }

    /**
     * Executes a non-query SQL statement (e.g., INSERT, UPDATE, DELETE).
     * tries to get rows affected after the command
     *
     * @param command - The SQL query string to execute.
     * @param params - The parameters to bind to the query.
     * @returns A promise that resolves with the result of the execution.
     * @throws An error if the execution fails or the database is not connected.
     */
    async execute(command: string, params: any): Promise<any> {
        let result = await this.query(replaceDollarSignWithQuestionMark(command), params);
        if (result.rowCount === 0) { // expected, sqlite does not return rowCount
            // assume is an update, delete or insert
            // and compute the number of rows affected
            let changes = await promisified.query(this.db, "select changes() as changes", []);
            result.rowCount = changes[0].changes;
        }
        return result
    }

}
