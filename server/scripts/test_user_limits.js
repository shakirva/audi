require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Subscription, Tenant, User } = require("./models");
const { Op } = require("sequelize");

const SECRET = process.env.JWT_SECRET;
const baseURL = "http://localhost:5005/api/v1";

const QA_TENANT_ID = 19;
async function getToken() {
  const owner = await User.findOne({ where: { tenantId: QA_TENANT_ID, role: "Owner" } });
  return jwt.sign({ id: owner.id, tenantId: QA_TENANT_ID, role: "Owner", envId: 1, status: "active" }, SECRET, { expiresIn: "1h" });
}

async function setPlan(plan) {
  await Subscription.update({ plan, status: "active" }, { where: { tenantId: QA_TENANT_ID } });
}

async function cleanUsers() {
  await User.destroy({ where: { tenantId: QA_TENANT_ID, role: { [Op.ne]: "Owner" } }, force: true });
}

async function tryCreateUser(token, num) {
  try {
    const res = await axios.post(`${baseURL}/auth/register`, {
      name: `User ${num}`,
      email: `user${num}_${Date.now()}@qa.com`,
      password: "password123",
      role: "Staff"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`CREATE User -> SUCCESS (${res.status}) - ID: ${res.data.data.id}`);
    return res.data.data.id;
  } catch (err) {
    console.log(`CREATE User -> BLOCKED (${err.response?.status}) - ${err.response?.data?.code}`);
    return null;
  }
}

async function tryToggleUser(token, userId) {
  try {
    const res = await axios.patch(`${baseURL}/settings/users/${userId}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`TOGGLE User ${userId} -> SUCCESS (${res.status}) - Active: ${res.data.data.active}`);
    return res.data.data.active;
  } catch (err) {
    console.log(`TOGGLE User ${userId} -> BLOCKED (${err.response?.status}) - ${err.response?.data?.code}`);
    return null;
  }
}

async function run() {
  const token = await getToken();
  
  console.log("--- TEST STARTER ---");
  await setPlan("starter");
  await cleanUsers();
  
  let u2 = await tryCreateUser(token, 2); 
  let u3 = await tryCreateUser(token, 3); 
  let u4 = await tryCreateUser(token, 4); 
  
  console.log("--- TEST DEACTIVATION ---");
  await tryToggleUser(token, u3); 
  u4 = await tryCreateUser(token, 4); 
  
  console.log("--- TEST REACTIVATION ---");
  await tryToggleUser(token, u3); 
  
  console.log("--- TEST PROFESSIONAL ---");
  await setPlan("professional");
  await tryToggleUser(token, u3); 
  for (let i = 5; i <= 10; i++) {
    await tryCreateUser(token, i);
  }
  await tryCreateUser(token, 11); 
  
  console.log("--- TEST BUSINESS ---");
  await setPlan("business");
  await tryCreateUser(token, 11); 
  
  process.exit(0);
}
run();
