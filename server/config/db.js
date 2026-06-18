const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

        if (!mongoUri) {
            return { connected: false, error: 'Missing MONGODB_URI or MONGO_URI' };
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return { connected: true };
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        return { connected: false, error: error.message };
    }
};

module.exports = connectDB;
