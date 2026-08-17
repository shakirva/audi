const sq = require("./db.js");
require("./models/index.js");

sq.query("UPDATE \"Users\" SET \"deletedAt\" = NULL WHERE \"deletedAt\" IS NOT NULL;")
  .then(() => {
    console.log("Restored deleted users");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
