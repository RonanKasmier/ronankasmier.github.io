import sqlite, { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./images/imglinks.db');

db.exec(`CREATE TABLE data(
    title TEXT PRIMARY KEY,
    desc TEXT,
    src TEXT
    )`);
