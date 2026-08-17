import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nipt_genetrust_db';

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  if (!global.mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // Quick fallback timeout if local MongoDB isn't running
    };

    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('Connected to MongoDB successfully');
      return mongooseInstance;
    }).catch((err) => {
      console.warn('MongoDB Connection Warning:', err.message);
      global.mongooseCache.promise = null;
      return null;
    });
  }

  try {
    global.mongooseCache.conn = await global.mongooseCache.promise;
  } catch (e) {
    global.mongooseCache.promise = null;
    console.warn('Failed to connect to MongoDB, operating with fallback memory store');
  }

  return global.mongooseCache.conn;
}
