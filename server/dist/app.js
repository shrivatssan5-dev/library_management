"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const memberAuth_1 = __importDefault(require("./routes/memberAuth"));
const memberBorrowings_1 = __importDefault(require("./routes/memberBorrowings"));
const books_1 = __importDefault(require("./routes/books"));
const members_1 = __importDefault(require("./routes/members"));
const borrowings_1 = __importDefault(require("./routes/borrowings"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const app = (0, express_1.default)();
function getEnvironment() {
    if (process.env.RENDER)
        return 'render';
    if (process.env.NODE_ENV === 'production')
        return 'production';
    return 'local';
}
function getAllowedOrigins() {
    const fromEnv = [process.env.FRONTEND_URL, process.env.STUDENT_APP_URL, process.env.ALLOWED_ORIGINS]
        .filter((value) => Boolean(value))
        .flatMap((value) => value.split(',').map((part) => part.trim()))
        .filter(Boolean);
    return [
        ...fromEnv,
        'https://library-management-flame-nu.vercel.app',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'capacitor://localhost',
        'https://localhost',
        'http://localhost',
    ];
}
app.use((0, cors_1.default)({
    origin(origin, callback) {
        // Allow server-to-server, mobile apps, and same-origin tools without an Origin header.
        if (!origin) {
            callback(null, true);
            return;
        }
        const allowed = getAllowedOrigins();
        if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.get('/api/health', async (_req, res) => {
    const dbHost = process.env.DATABASE_HOST ||
        (process.env.DATABASE_URL?.includes('@')
            ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0]
            : 'not configured');
    try {
        const { rows } = await db_1.pool.query('SELECT current_database() AS name');
        res.json({
            status: 'ok',
            database: rows[0].name,
            dbHost,
            environment: getEnvironment(),
        });
    }
    catch {
        res.status(503).json({
            status: 'error',
            database: null,
            dbHost,
            environment: getEnvironment(),
            message: 'Database connection failed. Check environment variables.',
        });
    }
});
app.use('/api/auth', auth_1.default);
app.use('/api/member-auth', memberAuth_1.default);
app.use('/api/member/borrowings', memberBorrowings_1.default);
app.use('/api/books', books_1.default);
app.use('/api/members', members_1.default);
app.use('/api/borrowings', borrowings_1.default);
app.use('/api/dashboard', dashboard_1.default);
exports.default = app;
