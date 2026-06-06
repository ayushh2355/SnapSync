const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/snapsync').then(async () => {
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(users);
  process.exit(0);
});
