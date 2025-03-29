import sqlite3 from 'sqlite3';
import { SqlConnection, SqlDbConnectionPool, SupportedDbEngines } from '../abstract-sql-db-pool-and-connection';
import { QueryResult, QueryResultRow } from 'pg';

export class SQLiteDbConnectionPool extends SqlDbConnectionPool {

    init(user?: string, password?: string) {
        // SQLite does not require user or password
    }

    async getConnection(): Promise<SQLiteConnection> {
        const openMode = this.options.readonly ? sqlite3.OPEN_READONLY : (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
        const db = new sqlite3.Database(this.options.database, openMode) // may block later if it can't connect
        return new SQLiteConnection(db)
    }

    end(): Promise<void> {
        return Promise.resolve();
    }
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
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // /**
    //  * Executes a non-query SQL statement (e.g., INSERT, UPDATE, DELETE).
    //  *
    //  * @param command - The SQL query string to execute.
    //  * @param params - The parameters to bind to the query.
    //  * @returns A promise that resolves with the result of the execution.
    //  * @throws An error if the execution fails or the database is not connected.
    //  */
    // execute(command: string, params: any): Promise<any> {
    //     return new Promise((resolve, reject) => {
    //         if (!this.db) {
    //             return reject(new Error('Database not connected'));
    //         }
    //         this.db.run(command, params, function (err) {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve(this);
    //             }
    //         });
    //     });
    // }

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
    query<RowType extends QueryResultRow>(query: string, params: any[]): Promise<QueryResult<RowType>> {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        rows,
                        command: query,
                        rowCount: rows.length
                    } as QueryResult<RowType>);
                }
            });
        });
    }
}

