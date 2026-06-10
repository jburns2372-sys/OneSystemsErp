const fs = require('fs');
const initSqlJs = require('sql.js');
async function run() {
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync('prisma/dev.db');
  const db = new SQL.Database(filebuffer);
  
  const rules = db.exec("SELECT * FROM KnowledgeRuleReference");
  if (rules.length > 0) {
    const columns = rules[0].columns;
    const values = rules[0].values;
    const ruleObjects = values.map(row => {
      let obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
    fs.writeFileSync('rules_backup.json', JSON.stringify(ruleObjects, null, 2));
    console.log(`Exported ${ruleObjects.length} rules to rules_backup.json`);
  } else {
    console.log("No rules found.");
  }
}
run().catch(console.error);
