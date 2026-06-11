"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const migrate_1 = require("../db/migrate");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
(0, migrate_1.migrate)()
    .then(() => {
    console.log('Migration finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('Migration failed:', error.message || error);
    if (error.code === 'ENOTFOUND') {
        console.error('\nTip: Use the Supabase Session pooler host (IPv4), not db.xxx.supabase.co.\n' +
            'Copy it from Supabase → Connect → Session pooler.');
    }
    if (error.code === '28P01') {
        console.error('\nTip: Wrong database password. Reset it in Supabase → Settings → Database,\n' +
            'then update DATABASE_PASSWORD in server/.env and run migrate again.');
    }
    process.exit(1);
});
