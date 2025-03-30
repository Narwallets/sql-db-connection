import { isoTruncDate } from "./utils/datetime";
import { SqlConnection } from "./connections/abstract-SqlConnection";

export type AppDbVersionRow = {
  app_code: string;
  version: number;
  date_updated: string;
}

export const CREATE_TABLE_APP_DEB_VERSION = `
  CREATE TABLE IF NOT EXISTS app_db_version (
    app_code TEXT,
    version INTEGER,
    date_updated TEXT,
    PRIMARY KEY (app_code)
  )`;

/** call this function to get the table schema version per appCode
 * and then execute upgrades based on the returned version
 *
 * Example:
 *
 * const conn = new PostgresConnection(connectionString);
 * await conn.connect();
 * const version = await getAppTableSchemaVersion(conn, APP_CODE);
 * if(!version) {}
 *   // create V1 tables (if not exists)
 *   await conn.query(CREATE_TABLE_VOTERS);
 *   await conn.query(CREATE_TABLE_VOTERS_PER_DAY_CONTRACT_ROUND);
 *   await conn.query(CREATE_TABLE_AVAILABLE_CLAIMS);
 *   // insert version as 1
 *   await setAppTableSchemaVersion(conn, APP_CODE, 1);
 * }
 *
 * // -----------------------------------
 * // UPGRADE TABLES VERSION if required
 * // -----------------------------------
 * if (version == 1) {
 *     // upgrade to version 2
 *     await conn.execute("ALTER TABLE voters add column vp_for_payment INTEGER")
 *     version += 1
 *     await setAppTableSchemaVersion(conn, APP_CODE, version);
 *
 * }
 * if (version == 2) {
 *     // upgrade to version 3
 *     await conn.execute(CREATE_TABLE_ENO);
 *     version += 1
 *     await setAppTableSchemaVersion(conn, APP_CODE, version);
 * }
 * if (version == 3) {
 *     // upgrade to version 4
 *     await conn.execute(CREATE_TABLE_ENO_BY_DELEGATOR);
 *     version += 1
 *     await setAppTableSchemaVersion(conn, APP_CODE, version);
 * }
*/
export async function getAppTableSchemaVersion(conn: SqlConnection, appCode: string) {
  await conn.execute(CREATE_TABLE_APP_DEB_VERSION); // if not exists
  const result = await conn.query<AppDbVersionRow>(
    `select max(version) version from app_db_version where app_code=$1`,
    [appCode]
  );
  let version = result.rows[0].version;
  if (version == null) { // no rows in version table
    version = 0
    await conn.execute(
      `insert into app_db_version(app_code,version,date_updated) values ($1,$2,$3)`,
      [appCode, version, isoTruncDate()]);
  }
  console.log("DB version:", version)
  return version
}

/** call this function to set the table schema version per appCode
 * and then execute upgrades based on the returned version
 */
export async function setAppTableSchemaVersion(conn: SqlConnection, appCode: string, version: number) {
  await conn.execute(
    `update app_db_version set version=$1, date_updated=$2 where app_code=$3`,
    [version, isoTruncDate(), appCode]
  );
  console.log("app_db_version updated to version:", version)
}
