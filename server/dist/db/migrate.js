"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("./index");
async function migrate() {
    const client = await index_1.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
      CREATE TABLE IF NOT EXISTS librarians (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(20) UNIQUE,
        genre VARCHAR(100),
        copies_total INTEGER NOT NULL DEFAULT 1 CHECK (copies_total >= 0),
        copies_available INTEGER NOT NULL DEFAULT 1 CHECK (copies_available >= 0),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(30),
        membership_number VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS borrowings (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
        librarian_id INTEGER NOT NULL REFERENCES librarians(id) ON DELETE RESTRICT,
        borrowed_at TIMESTAMPTZ DEFAULT NOW(),
        due_date DATE NOT NULL,
        returned_at TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'returned', 'overdue'))
      )
    `);
        const { rows } = await client.query('SELECT id FROM librarians WHERE email = $1', ['librarian@library.com']);
        if (rows.length === 0) {
            const passwordHash = await bcryptjs_1.default.hash('librarian123', 10);
            await client.query('INSERT INTO librarians (email, password_hash, name) VALUES ($1, $2, $3)', ['librarian@library.com', passwordHash, 'Default Librarian']);
            console.log('Seeded default librarian: librarian@library.com / librarian123');
        }
        await client.query('COMMIT');
        console.log('Database migration completed');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
