import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/User.model.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const indexes = await User.collection.getIndexes();
  console.log('INDEXES:', JSON.stringify(indexes, null, 2));
  
  const usersWithNullEmail = await User.find({ email: null });
  console.log('USERS WITH NULL EMAIL:', usersWithNullEmail.length);
  if (usersWithNullEmail.length > 0) {
    console.log('First one:', usersWithNullEmail[0]);
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
