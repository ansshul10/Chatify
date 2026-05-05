import mongoose from 'mongoose';
import 'dotenv/config';

async function fix() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    console.log('Dropping email_1 index...');
    await collection.dropIndex('email_1');
    console.log('Dropped email_1.');
  } catch (err) {
    console.log('Note: email_1 index might not exist or already dropped:', err.message);
  }

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    console.log('Dropping username_1 index...');
    await collection.dropIndex('username_1');
    console.log('Dropped username_1.');
  } catch (err) {
    console.log('Note: username_1 index might not exist:', err.message);
  }

  console.log('Done. Mongoose will recreate indexes correctly on next start.');
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
