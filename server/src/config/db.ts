import mongoose from 'mongoose';

async function connectDB(): Promise<void> {
  const url = process.env.MONGODB_URI;

  if (!url) {
    console.error('MONGODB_URI is not set.');
    return;
  }

  try {
    await mongoose.connect(url);
    console.log('Connected to MongoDB');
  } catch (e) {
    console.error('MongoDB Connection Error:', e);
  }
}

export default connectDB;
