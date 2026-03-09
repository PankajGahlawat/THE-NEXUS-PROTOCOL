// Simple in-memory database replacement for better-sqlite3
class SimpleDB {
  constructor() {
    this.tables = {};
    this.autoIncrements = {};
  }

  exec(sql) {
    // Parse CREATE TABLE statements
    const createMatches = sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\);/g);
    for (const match of createMatches) {
      const tableName = match[1];
      this.tables[tableName] = [];
      this.autoIncrements[tableName] = 1;
    }
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        try {
          if (sql.includes('INSERT INTO')) {
            const tableMatch = sql.match(/INSERT INTO (\w+)/);
            if (tableMatch) {
              const tableName = tableMatch[1];
              const row = { id: self.autoIncrements[tableName]++ };
              
              // Map parameters to row
              const fieldsMatch = sql.match(/\((.*?)\) VALUES/);
              if (fieldsMatch) {
                const fields = fieldsMatch[1].split(',').map(f => f.trim());
                fields.forEach((field, i) => {
                  row[field] = params[i];
                });
              }
              
              self.tables[tableName].push(row);
            }
          } else if (sql.includes('UPDATE')) {
            const tableMatch = sql.match(/UPDATE (\w+)/);
            if (tableMatch) {
              const tableName = tableMatch[1];
              const table = self.tables[tableName] || [];
              
              // Find WHERE condition
              const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/);
              if (whereMatch) {
                const whereField = whereMatch[1];
                const whereValue = params[params.length - 1];
                
                const row = table.find(r => r[whereField] == whereValue);
                if (row) {
                  // Parse SET clause
                  const setMatch = sql.match(/SET\s+(.*?)\s+WHERE/);
                  if (setMatch) {
                    const setParts = setMatch[1].split(',');
                    let paramIndex = 0;
                    
                    setParts.forEach((part) => {
                      const trimmed = part.trim();
                      
                      if (trimmed.includes('balance=balance-?')) {
                        row.balance = (row.balance || 0) - params[paramIndex++];
                      } else if (trimmed.includes('balance=balance+?')) {
                        row.balance = (row.balance || 0) + params[paramIndex++];
                      } else {
                        const [field] = trimmed.split('=').map(s => s.trim());
                        row[field] = params[paramIndex++];
                      }
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          // Silently ignore errors for compatibility
        }
      },
      
      get(...params) {
        try {
          const tableMatch = sql.match(/FROM (\w+)/);
          if (!tableMatch) return null;
          
          const tableName = tableMatch[1];
          const table = self.tables[tableName] || [];
          
          // Handle WHERE clause with AND
          const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER|\s*$)/i);
          if (whereMatch) {
            const whereClause = whereMatch[1];
            
            return table.find(row => {
              // Split by AND
              const conditions = whereClause.split(/\s+AND\s+/i);
              let paramIndex = 0;
              
              return conditions.every(condition => {
                const match = condition.match(/(\w+)\s*=\s*\?/);
                if (match) {
                  const field = match[1];
                  const value = params[paramIndex++];
                  return row[field] == value;
                }
                return true;
              });
            });
          }
          
          return table[0];
        } catch (e) {
          return null;
        }
      },
      
      all(...params) {
        try {
          const tableMatch = sql.match(/FROM (\w+)/);
          if (!tableMatch) return [];
          
          const tableName = tableMatch[1];
          const table = self.tables[tableName] || [];
          
          // Handle WHERE clause
          const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER|\s*$)/i);
          if (whereMatch) {
            const whereClause = whereMatch[1];
            
            return table.filter(row => {
              // Handle OR conditions
              if (whereClause.includes(' OR ')) {
                const orParts = whereClause.split(/\s+OR\s+/i);
                return orParts.some((part, idx) => {
                  const match = part.match(/(\w+)\s*=\s*\?/);
                  if (match) {
                    const field = match[1];
                    const value = params[idx];
                    return row[field] == value;
                  }
                  return false;
                });
              }
              
              // Handle LIKE conditions
              if (whereClause.includes('LIKE')) {
                const likeMatch = whereClause.match(/(\w+)\s+LIKE\s+\?/);
                if (likeMatch) {
                  const field = likeMatch[1];
                  const value = params[0];
                  if (value && row[field]) {
                    const searchValue = value.replace(/%/g, '');
                    return row[field].toLowerCase().includes(searchValue.toLowerCase());
                  }
                }
                return false;
              }
              
              // Handle simple = conditions
              const match = whereClause.match(/(\w+)\s*=\s*\?/);
              if (match) {
                const field = match[1];
                const value = params[0];
                return row[field] == value;
              }
              
              return true;
            });
          }
          
          return table;
        } catch (e) {
          return [];
        }
      }
    };
  }
}

module.exports = SimpleDB;
