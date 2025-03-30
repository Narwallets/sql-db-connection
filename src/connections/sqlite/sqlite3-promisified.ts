import { QueryResultRow } from 'pg';
import { Database, Statement } from 'sqlite3';

export function close(db: Database): Promise<void> {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export function query(db: Database, query: string, params: any): Promise<QueryResultRow[]> {
    return new Promise((resolve, reject) => {
        db.all<QueryResultRow>(query, params, function (err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

