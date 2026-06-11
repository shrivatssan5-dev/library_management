"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const migrate_1 = require("./db/migrate");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const PORT = process.env.PORT || 3001;
async function start() {
    try {
        await (0, migrate_1.migrate)();
        app_1.default.listen(PORT, () => {
            console.log(`Library API running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
