import { QueryResult, QueryResultRow } from "pg";
import { buildInsert } from "../builders/build-inserts";

export type SupportedDbEngines = "pg" | "sq3"

export type DbConnectionPoolOptions = {
  engine: SupportedDbEngines, // database engine
  database: string; // filename for sqlite
  readonly?: boolean; // if true, open the database in read-only mode
  host?: string;
  port?: number;
  caCertificateFile?: string // certificate file to make sure we connect to the right server
}

/** Abstract class for generic SQL connection pools */
export abstract class SqlDbConnectionPool {

  constructor(
    public options: DbConnectionPoolOptions
  ) { }

  abstract init(user?: string, password?: string): void;

  abstract getConnection(): Promise<SqlConnection>;

  abstract end(): void;
}

/** Abstract class for generic SQL connections, instance is created by the pool */
export abstract class SqlConnection {

  abstract get dbEngine(): SupportedDbEngines;

  abstract release(): void;

  /**
    Execute a query and return rows.
   * @param query - The SQL query string.
   * @param params - Query parameters.
   * @returns A promise resolving to the query result.
   */
  abstract query<RowType extends QueryResultRow>(
    query: string,
    params: any[]
  ): Promise<QueryResult<RowType>>;

  /**
   * Execute a query without returning rows (e.g., for INSERT, UPDATE, DELETE).
   * @param query - The SQL query string.
   * @param params - Optional query parameters.
   */
  execute(query: string, params?: any[]) {
    return this.query(query, params || []);
  }

  /**
   * Inserts rows into a specified table with support for conflict resolution.
   *
   * This method begins a database transaction, attempts to insert the provided rows,
   * and either commits the transaction on success or rolls it back on failure.
   *
   * @param table - The name of the table where rows will be inserted.
   * @param dbRows - An array of rows to be inserted, represented as `QueryResultRow` objects.
   * @param onConflict - Optional conflict resolution arguments, used to handle
   *                     scenarios where unique constraints are violated.
   *
   * @throws Will log an error and roll back the transaction if the insertion fails.
   */
  async insert(
    table: string,
    dbRows: QueryResultRow[],
    onConflict?: OnConflictDoUpdate) {

    const { statement, values } =
      buildInsert(this.dbEngine, "insert", table, dbRows, onConflict)
    try {
      await this.query(statement, values);
    } catch (err) {
      console.error(`inserting on ${table}`)
      console.error('An error occurred', err);
      console.error(statement)
      console.error(values)
      throw err
    }
  }

  async insertOrReplace(
    table: string,
    dbRows: QueryResultRow[],
    onConflict?: OnConflictDoUpdate) {

    const { statement, values } =
      buildInsert(this.dbEngine, "insert or replace", table, dbRows, onConflict)
    try {
      await this.query(statement, values);
    } catch (err) {
      console.error(`inserting on ${table}`)
      console.error('An error occurred', err);
      console.error(statement)
      console.error(values)
      throw err
    }
  }
}

/** OnConflictDoUpdate example:
 *
 *  {
 *    onConflictArgument: "(id)",
 *    onConflictCondition: "WHERE id <> EXCLUDED.id"
 * }
 *
 * Internal expansion:
 *   let setFieldsWithExcludedValue =
 *      fields.map(field => `${field}=EXCLUDED.${field}`)
 *   statement = statement +
 *             " ON CONFLICT " +
 *             onConflict.onConflictArgument +
 *             " DO UPDATE SET " +
 *               setFieldsWithExcludedValue.join(",") + " "
 *               + onConflict.onConflictDoUpdateCondition
 */
export type OnConflictDoUpdate = {
  onConflictArgument: string,
  onConflictDoUpdateCondition: string
}

