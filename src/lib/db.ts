import { MongoClient } from 'mongodb';
import mongoose, { Mongoose } from 'mongoose';
import config from './config';

const client = new MongoClient(config.MONGODB_URI);

export let db: Mongoose;

export async function connectToDatabase() {
    if (db) return db;

    try {
        db = await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME });

        await client.connect();
        console.log('Connected to MongoDB!');
    } catch (err) {
        console.error('Failed to connect to MongoDB!', err);
        throw err;
    }
}

export async function closeDatabaseConnection() {
    await client.close();
    console.log('MongoDB connection closed!');
}
