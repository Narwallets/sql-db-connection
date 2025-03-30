import { QueryResult, QueryResultRow } from "..";
import { buildInsert } from "../builders/build-inserts";
import { SupportedDbEngines } from "./abstract-ConnectionPool";

/** Abstract class for generic SQL connections, instance is created by the pool */
export abstract class SqlConnection {

  abstract get dbEngine(): SupportedDbEngines;

  abstract release(): void;

  /**
    queries and return rows.
   * @param query - The SQL query string.
   * @param params - Query parameters.
   * @returns A promise resolving to the query result.
   */
  abstract query<RowType extends QueryResultRow>(
    query: string,
    params: any[]
  ): Promise<QueryResult<RowType>>;

  /**
    Execute a command and return rowCount = rows affected.
   * @param query - The SQL query string.
   * @param params - Query parameters.
   * @returns A promise resolving to the query result.
   */
  abstract execute<RowType extends QueryResultRow>(
    query: string,
    params?: any[]
  ): Promise<QueryResult<RowType>>;

  /**
  queries a single row.
 * @param query - The SQL query string.
 * @param params - Query parameters.
 * @returns A promise resolving to the query result.
 */
  async queryRow<RowType extends QueryResultRow>(
    query: string,
    params: any[]
  ): Promise<RowType> {
    let result = await this.query<RowType>(query, params);
    return result.rows[0];
  };

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
   *
   *
   * OnConflictDoUpdate example:
   *
   *  {
   *    onConflictFields: "id",
   *    doUpdateOnConflictCondition: "WHERE timestamp <  EXCLUDED.timestamp"
   * }
   *
   * Internal expansion:
   *   statement = statement +
   *             " ON CONFLICT (" + onConflict.onConflictFields + ")" +
   *             " DO UPDATE SET " +
   *               fields.map(field => `${field}=EXCLUDED.${field}`).join(",") + " "
   *               + (onConflict.onConflictDoUpdateCondition||"")
   */
  async insert(
    table: string,
    dbRows: QueryResultRow[],
    options?: SqlCommandOptions) {
    const { statement, values } =
      buildInsert(table, dbRows, options?.onConflictUpdate)
    try {
      let result = await this.execute(statement, values);
      console.log(`Inserted ${result.rowCount} rows into ${table}`);
      return result
    }
    catch (err) {
      console.error(`inserting on ${table}`)
      console.error(statement)
      console.error(values)
      console.error('An error occurred', err);
      throw err
    }
  }

  async insertRow(
    table: string,
    row: QueryResultRow,
    options?: SqlCommandOptions) {
    return this.insert(table, [row], options)
  }

  async insertOrReplace(
    table: string,
    dbRows: QueryResultRow[],
    idFields: string,
  ) {
    return this.insert(table, dbRows, {
      onConflictUpdate: { conflictFields: idFields }
    })
  }
}

export type SqlCommandOptions = {
  onConflictUpdate?: OnConflictUpdate,
}

/** OnConflictDoUpdate example:
 *
 *  {
 *    conflictFields: "(id)",
 *    doUpdateOnConflictCondition: "WHERE id <> EXCLUDED.id"
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
export type OnConflictUpdate = {
  conflictFields: string,
  doUpdateOnConflictCondition?: string
}

