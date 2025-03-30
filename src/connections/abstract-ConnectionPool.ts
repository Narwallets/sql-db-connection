import { SqlConnection } from "./abstract-SqlConnection";

export type SupportedDbEngines = "pg" | "sq3"

export type DbConnectionPoolOptions = {
    engine: SupportedDbEngines, // database engine
    database: string; // filename for sqlite
    readonly?: boolean; // if true, open the database in read-only mode
    host?: string;
    user?: string;
    port?: number;
    caCertificateFile?: string // certificate file to make sure we connect to the right server
}

/** Abstract class for generic SQL connection pools */

export abstract class SqlDbConnectionPool {

    constructor(
        public options: DbConnectionPoolOptions
    ) { }

    abstract init(password?: string): void;

    abstract getConnection(): Promise<SqlConnection>;

    abstract end(): void;
}
