const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Load environment variables
dotenv.config();

const app = express();
const serviceStatus = {
    database: false,
    storageMode: 'local-file',
    jwt: true,
    ai: Boolean(process.env.GROQ_API_KEY)
};

const warnForMissingConfig = () => {
    const missingEnvVars = [];

    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        missingEnvVars.push('MONGODB_URI or MONGO_URI');
    }
    if (!process.env.GROQ_API_KEY) {
        missingEnvVars.push('GROQ_API_KEY');
    }

    if (missingEnvVars.length > 0) {
        console.warn(`Starting in degraded mode. Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
};

app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    const statusCode = serviceStatus.ai ? 200 : 503;

    res.status(statusCode).json({
        status: statusCode === 200 ? 'ok' : 'degraded',
        message: serviceStatus.ai
            ? 'All core services are available.'
            : 'Auth works locally, but AI generation needs a GROQ_API_KEY.',
        services: serviceStatus
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
const clientIndexPath = path.join(clientBuildPath, 'index.html');

if (fs.existsSync(clientIndexPath)) {
    app.use(express.static(clientBuildPath));

    // Serve the built client when it exists, but don't break API-only local development.
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }

        return res.sendFile(clientIndexPath);
    });
} else {
    app.get('/', (req, res) => {
        res.json({
            message: 'API is running. Build the client or run the Vite dev server to access the frontend.'
        });
    });
}


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    warnForMissingConfig();

    const dbStatus = await connectDB();
    serviceStatus.database = dbStatus.connected;
    serviceStatus.storageMode = dbStatus.connected ? 'database' : 'local-file';

    if (!dbStatus.connected && dbStatus.error) {
        console.warn(`Database unavailable. Falling back to local file storage. Reason: ${dbStatus.error}`);
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
