export interface SqliteScriptResult {
    rows: any[];
    columns: string[];
    rowsAffected: number;
    lastInsertRowid?: bigint | number;
}
export interface SqliteScriptClient {
    execute(stmtOrSql: string | {
        sql: string;
        args?: any[];
    }): Promise<SqliteScriptResult>;
    close(): void | Promise<void>;
}
export declare function createSqliteScriptClient(url: string): Promise<SqliteScriptClient>;
//# sourceMappingURL=sqlite-client.d.ts.map