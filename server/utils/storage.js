const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/User');
const EmailHistory = require('../models/EmailHistory');

const dataDir = path.join(__dirname, '..', 'data');
const dataFilePath = path.join(dataDir, 'dev-store.json');

const isMongoConnected = () => mongoose.connection.readyState === 1;

const ensureDataFile = () => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify({ users: [], emailHistory: [] }, null, 2));
    }
};

const loadData = () => {
    ensureDataFile();
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    const parsed = JSON.parse(raw);

    return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        emailHistory: Array.isArray(parsed.emailHistory) ? parsed.emailHistory : []
    };
};

const saveData = (data) => {
    ensureDataFile();
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

const withUserMethods = (user) => {
    if (!user) {
        return null;
    }

    return {
        ...user,
        otpExpiry: user.otpExpiry ? new Date(user.otpExpiry) : undefined,
        async matchPassword(enteredPassword) {
            return bcrypt.compare(enteredPassword, this.password);
        },
        async save() {
            const data = loadData();
            const index = data.users.findIndex((entry) => entry._id === this._id);

            if (index === -1) {
                throw new Error('User not found');
            }

            data.users[index] = {
                ...data.users[index],
                ...this,
                otpExpiry: this.otpExpiry ? new Date(this.otpExpiry).toISOString() : null
            };

            saveData(data);
            return withUserMethods(data.users[index]);
        }
    };
};

const stripPassword = (user) => {
    if (!user) {
        return null;
    }

    const { password, ...safeUser } = user;
    return safeUser;
};

const createUser = async ({ name, email, password, otp, otpExpiry }) => {
    if (isMongoConnected()) {
        return User.create({ name, email, password, otp, otpExpiry });
    }

    const data = loadData();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
        _id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        otp,
        otpExpiry: new Date(otpExpiry).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    data.users.push(user);
    saveData(data);
    return withUserMethods(user);
};

const findUserByEmail = async (email) => {
    if (isMongoConnected()) {
        return User.findOne({ email });
    }

    const data = loadData();
    const user = data.users.find((entry) => entry.email === email);
    return withUserMethods(user || null);
};

const findUserById = async (userId) => {
    if (isMongoConnected()) {
        return User.findById(userId);
    }

    const data = loadData();
    const user = data.users.find((entry) => entry._id === userId);
    return withUserMethods(user || null);
};

const findSafeUserById = async (userId) => {
    if (isMongoConnected()) {
        return User.findById(userId).select('-password');
    }

    const user = await findUserById(userId);
    return stripPassword(user);
};

const createHistoryEntry = async (entry) => {
    if (isMongoConnected()) {
        return EmailHistory.create(entry);
    }

    const data = loadData();
    const historyEntry = {
        _id: crypto.randomUUID(),
        ...entry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    data.emailHistory.push(historyEntry);
    saveData(data);
    return historyEntry;
};

const getHistoryByUserId = async (userId) => {
    if (isMongoConnected()) {
        return EmailHistory.find({ userId }).sort({ createdAt: -1 });
    }

    const data = loadData();
    return data.emailHistory
        .filter((entry) => entry.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

module.exports = {
    createHistoryEntry,
    createUser,
    findSafeUserById,
    findUserByEmail,
    findUserById,
    isMongoConnected,
    getHistoryByUserId
};
