import { OnConflictUpdate } from "../connections/abstract-SqlConnection";

/**
 * generates an SQL INSERT statement for inserting multiple rows into a table.
 * It supports conflict resolution using the ON CONFLICT clause.
 * @param table
 * @param rows
 * @param onConflict
 * @returns
 */
export function buildInsert(
    table: string,
    rows: Record<string, any>[],
    onConflict?: OnConflictUpdate,
)
    : {
        statement: string,
        values: any[]
    } {
    let fields = [], values = []
    // use rows[0] to get the fields
    //  assuming all rows have the same fields
    for (let key in rows[0]) {
        fields.push(key)
    }
    // push placeholders and values
    let index = 0
    let valuesStatementPart = []
    for (let row of rows) {
        let thisRowPlaceholders = []
        for (let field of fields) {
            index++
            thisRowPlaceholders.push("$" + index)
            values.push(row[field])
        }
        // enclose each value row with placeholders in parentheses
        valuesStatementPart.push(`(${thisRowPlaceholders.join(",")})`)
    }

    let statement =
        `insert into ${table} (${fields.join(",")})`
        + ` values ${valuesStatementPart.join(",")}`

    //  Note:
    // "RETURNING *;" can be added to the end of the statement
    //  to return the inserted rows.
    //  This is not supported in SQLite, so it should be added
    //  conditionally based on the dbEngine.
    //  For PostgreSQL, you can add it like this:
    //  statement += " RETURNING *"
    //  For SQLite, you can omit it or handle it differently.
    //  For example, you can use the last_insert_rowid() function
    //  to get the last inserted row ID.

    if (onConflict) {
        statement = statement + '\n' +
            " ON CONFLICT (" + onConflict.conflictFields + ")" +
            " DO UPDATE SET " +
            fields.map(field => `${field}=EXCLUDED.${field}`).join(",") +
            " " + (onConflict.doUpdateOnConflictCondition || "")
    }
    return { statement, values }

}
