const Database = require('better-sqlite3');
const fs = require('fs');

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const MAX_RSS_SAVE_DAYS = 180;

let sql_file = process.cwd() + '/sqlites/sqlite.db';
var db = new Database(sql_file);
db.pragma('journal_mode = WAL');

//init table
function init() {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS subscene (
            lang TEXT,
            path TEXT,
            dlpath TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS opensubtitles (
            id TEXT,
            sub_id INTEGER,
            lang_code TEXT,
            title TEXT,
            ai_translated INTEGER,
            from_trusted INTEGER,
            uploader_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id, sub_id)
        )
    `).run();
}

init();

const Tables = {
    Subscene: 'subscene',
    Opensubtitles: 'opensubtitles'
}

//clean RSS > 30 days
function cleanRSS() {
    let result =  db.prepare(`
        DELETE FROM subscene
        WHERE updated_at <= DATETIME('now', '-${MAX_RSS_SAVE_DAYS} days')
    `).run();

    console.log('SUBSCENE, DELETED:', result.changes, 'ROW');

    let result2 =  db.prepare(`
        DELETE FROM opensubtitles
        WHERE updated_at <= DATETIME('now', '-${MAX_RSS_SAVE_DAYS} days')
    `).run();

    console.log('OPENSUBTITLES, DELETED:', result2.changes, 'ROW');
}

function clean() {
    try {
        console.warn("Start Cleaning...");
        console.warn("Cleaning RSS...");
        cleanRSS();
    }
    catch (err) {
        console.warn("Clean Failed!");
        console.error(err);
    }
}

setInterval(clean, ONE_DAY_IN_MS);

function set(table, keys = Array, values = Array, where, value) {
    if(!where) {
        const sql = `INSERT OR IGNORE INTO ${table} (${keys.join(',')}) VALUES (${'?,'.repeat(keys.length - 1)}?)`;
        const insert = db.prepare(sql);
        return insert.run(values);
    } else {
        keys = keys.map(key => `${key} = ?`).join(',');
        const sql = `UPDATE ${table} SET ${keys}, updated_at = CURRENT_TIMESTAMP WHERE ${where} = ?`;
        const update = db.prepare(sql);
        return update.run([...values, value]);
    }
}

function InsertMany(table, keys = Array, values = Array) {
    if(!keys?.length || !values?.length) throw "InsertMany Function: Input keys or values is empty";
    const insert = db.prepare(`INSERT OR IGNORE INTO ${table} (${keys.join(',')}) VALUES (${'?,'.repeat(keys.length - 1)}?)`);
    let inserted = 0;
    const insertMany = db.transaction((values) => {
        for(const value of values) {
            let _ins = insert.run(value);
            inserted += _ins.changes;
        }
    });
    insertMany(values);

    return { changes: inserted };
}

function get(table, wheres = Array, values = Array) {
    wheres = wheres.map(where => `${where} = ?`).join(' AND ');
    const sql = `SELECT * FROM ${table} WHERE ${wheres}`;
    const select  = db.prepare(sql);
    return select.get(values);
}

function getAll(table, wheres = Array, values = Array) {
    wheres = wheres.map(where => `${where} = ?`).join(' AND ');
    const select  = db.prepare(`SELECT * FROM ${table} WHERE ${wheres}`);
    return select.all(values);
}

function del(table, wheres = Array, values = Array) {
    wheres = wheres.map(where => `${where} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${wheres}`;
    const select  = db.prepare(sql);
    return select.run(values);
}

function fileInfo() {
    const info = fs.statSync(sql_file);
    return info;
}

function loadSQL(path) {
    db.close();
    sql_file = path;
    db = new Database(sql_file);
    db.pragma('journal_mode = WAL');
    init();
}

function forceCheckPoint(type) {
    db.pragma(`wal_checkpoint(${type})`);
}

function getSQLFile() {
    return sql_file;
}

module.exports = {
    prepare: (...args) => db.prepare(...args),
    get, set, del,
    getAll, InsertMany,
    Tables,
    fileInfo, getSQLFile,
    loadSQL, forceCheckPoint
};