import { OnConflictDoUpdate } from "../connections/abstract-sql-db-pool-and-connection";

/**
 * generates an SQL INSERT statement for inserting multiple rows into a table.
 * It supports conflict resolution using the ON CONFLICT clause.
 * @param dbEngine
 * @param insertCmd
 * @param table
 * @param rows
 * @param onConflict
 * @returns
 */
export function buildInsert(
    dbEngine: "pg" | "sq3",
    insertCmd: "insert" | "insert or replace",
    table: string,
    rows: Record<string, any>[],
    onConflict?: OnConflictDoUpdate,
)
    : {
        statement: string,
        values: any[]
    } {
    let fields = [], placeholders = [], values = []
    for (let key in rows[0]) {
        fields.push(key)
    }
    let index = 0
    let valuesStatementPart = []
    for (let row of rows) {
        let placeholders = []
        for (let field of fields) {
            index++
            placeholders.push(dbEngine == "sq3" ? "?" : "$" + index)
            values.push(row[field])
        }
        valuesStatementPart.push(`values (${placeholders.join(",")})`)
        values.push(...fields.map(field => row[field])); // Collect values for the row
    }

    let statement =
        `${insertCmd} into ${table}(${fields.join(",")})`
        + valuesStatementPart.join(",")

    if (onConflict) {
        let setFieldsWithExcludedValues = fields.map(field => `${field}=EXCLUDED.${field}`)
        statement = statement +
            " ON CONFLICT " +
            onConflict.onConflictArgument +
            " DO UPDATE SET " +
            setFieldsWithExcludedValues.join(",") +
            " " + onConflict.onConflictDoUpdateCondition
    }
    return { statement, values }
}
