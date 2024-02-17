const fs = require('fs')
const path = require('path')

const migrationsDir = path.join(__dirname, 'migrations')

// Function to generate the new views migration file
const generateViewsMigration = (versionNumber) => {
  const className = `Views${versionNumber}`
  const fileName = `${versionNumber}-Views.js`
  const fileContent = `
const { getViewDefinitions } = require('../viewDefinitions')

module.exports = class ${className} {
  name = '${className}'

  async up(db) {
    const viewDefinitions = getViewDefinitions(db);
    for (const [tableName, viewConditions] of Object.entries(viewDefinitions)) {
      if (Array.isArray(viewConditions)) {
        await db.query(\`
          CREATE OR REPLACE VIEW "\${tableName}" AS
            SELECT *
            FROM "admin"."\${tableName}" AS "this"
            WHERE \${viewConditions.map(cond => \`(\${cond})\`).join(' AND ')}
        \`);
      } else {
        await db.query(\`
          CREATE OR REPLACE VIEW "\${tableName}" AS (\${viewConditions})
        \`);
      }
    }
  }  

  async down(db) {
    const viewDefinitions = this.getViewDefinitions(db)
    for (const viewName of Object.keys(viewDefinitions)) {
      await db.query(\`DROP VIEW "\${viewName}"\`)
    }
  }
}
`

  const filePath = path.join(migrationsDir, fileName)
  fs.writeFileSync(filePath, fileContent)
  console.log(`Generated new views migration: ${filePath}`)
}

// Get the latest data migration number and generate the views migration
generateViewsMigration(Date.now())
