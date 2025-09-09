// Dynamic import to reduce bundle size
import { getMongoose } from './dynamicImports';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://e4znHByQ3QiNgH9z:e4znHByQ3QiNgH9z@ilyaas2012.0v7gqav.mongodb.net/";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

declare global {
  var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Dynamically import mongoose
    const mongoose = await getMongoose();
    
    const opts = {
      bufferCommands: false,
      dbName: 'kobac-real-estate',
      maxPoolSize: 20, // Balanced pool size
      minPoolSize: 5, // Reasonable minimum connections
      serverSelectionTimeoutMS: 5000, // More reasonable timeout
      socketTimeoutMS: 30000, // Longer socket timeout
      connectTimeoutMS: 10000, // More reasonable connection timeout
      family: 4, // Use IPv4 only
      maxIdleTimeMS: 30000, // Longer idle time
      heartbeatFrequencyMS: 10000, // Standard heartbeat
      retryWrites: true,
      retryReads: true,
      compressors: 'zlib', // Enable compression
      zlibCompressionLevel: 6, // Fast compression
      // Add connection resilience
      maxConnecting: 10,
      waitQueueTimeoutMS: 5000,
      // Add read preferences for better performance
      readPreference: 'secondaryPreferred',
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose: any) => {
      console.log('✅ Connected to MongoDB with optimized settings');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
