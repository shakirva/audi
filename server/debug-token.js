require("dotenv").config();
const { User } = require("./models");
const jwt = require("jsonwebtoken");

async function debug() {
  try {
    const user = await User.findOne({ where: { name: 'sample owner' } });
    if (!user) return console.log("User not found!");
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("TOKEN:", token);
  } catch(e) { console.error(e); }
  process.exit();
}
debug();
