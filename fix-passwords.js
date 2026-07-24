const sequelize = require('./server/db');
const User = require('./server/models/User');

async function fix() {
  await sequelize.authenticate();
  const users = await User.findAll();
  for (const user of users) {
    if (!user.plainPassword) {
      user.password = 'password123';
      await user.save();
      console.log(`Updated user ${user.email} to password123`);
    }
  }
  console.log("Done");
  process.exit(0);
}

fix().catch(err => console.error(err));
