"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
function isSupabase() {
    const url = process.env.DATABASE_URL ?? '';
    const host = process.env.DATABASE_HOST ?? '';
    return url.includes('supabase.co') || host.includes('supabase.co');
}
function resolveSsl() {
    if (process.env.DATABASE_SSL === 'false' && !isSupabase()) {
        return false;
    }
    if (process.env.DATABASE_SSL === 'true' ||
        isSupabase() ||
        process.env.DATABASE_URL?.includes('sslmode=')) {
        return { rejectUnauthorized: false };
    }
    return false;
}
function normalizeConnectionString(url) {
    // Let pg Pool ssl config handle TLS; avoid sslmode forcing verify-full on Supabase.
    return url.replace(/([?&])sslmode=[^&]*&?/g, '$1').replace(/[?&]$/, '');
}
function buildPoolConfig() {
    const ssl = resolveSsl();
    if (process.env.DATABASE_URL) {
        return {
            connectionString: normalizeConnectionString(process.env.DATABASE_URL),
            ssl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        };
    }
    if (process.env.DATABASE_HOST) {
        return {
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT) || 5432,
            database: process.env.DATABASE_NAME,
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            ssl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        };
    }
    throw new Error('Database not configured. Set DATABASE_URL or DATABASE_HOST/DATABASE_NAME/DATABASE_USERNAME/DATABASE_PASSWORD.');
}
exports.pool = new pg_1.Pool(buildPoolConfig());
exports.pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error', err);
});
