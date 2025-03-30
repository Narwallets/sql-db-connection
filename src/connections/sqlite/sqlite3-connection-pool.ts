import sqlite3 from 'sqlite3';
import { SqlDbConnectionPool } from '../abstract-ConnectionPool';
import { SQLiteConnection } from './sqlite3-connection';

// mocked SQLiteDbConnectionPool to unify interface with Postgres
export class SQLiteDbConnectionPool extends SqlDbConnectionPool {

    init(password?: string) {
        // SQLite does not require user or password
    }

    async getConnection(): Promise<SQLiteConnection> {
        const openMode = this.options.readonly ? sqlite3.OPEN_READONLY : (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
        const db = new sqlite3.Database(this.options.database, openMode); // has a callback, may block later if it can't connect
        return new SQLiteConnection(db);
    }

    end(): Promise<void> {
        return Promise.resolve();
    }
}
