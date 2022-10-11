const fs = require('fs');

const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const mySQL = require('mysql2');
const mysqldump = require('mysqldump');
const { TableRestaurant } = require('@mui/icons-material');

// Creating global empty arrays to hold foreign keys, primary keys, and tableList
let foreignKeyList = [];
let primaryKeyList = [];
let primaryKeyListArray = [];
let tableList = [];
let exportedTables = 0;

const mySQLdataController = {};

/**
 * mySQL Dump Query
 * Formulates an array with a pg_dump query at position 0, and a filename for dump location at position 1.
 * @param {string} hostname - A required string with database hostname
 * @param {string} password - A required string with database password
 * @param {string} port - A required string with database port
 * @param {string} username - A required string with database username
 * @param {string} databaseName - A required string with the database name
 * @return {string[]} command - Array containing pg_dump query and destination filename
 */
// function mySQLdumpQuery(hostname, password, port, username, databaseName) {
//   console.log('MYSQLDUMPQUERY IS BEING INVOKED');
//   const command = [];
//   const currentDateTime = new Date();
//   const resultInSeconds = parseInt(currentDateTime.getTime() / 1000);

//   const filename = path.join(
//     __dirname,
//     `../db_schemas/${username}${databaseName}${resultInSeconds.toString()}.sql`
//   );
//   command.push(
//     `mysqldump --host ${hostname} --port ${port} --user ${username} --password ${password} --databases ${databaseName} --no-data > ${filename}`
//   );
//   command.push(filename);
//   return command;
// }

/**
 * testDrop
 * Usage unclear - Consider removing -- NOTE
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
// mySQLdataController.testDrop = (req, res, next) => {};

/**
 * getSchema
 * Option 1 - Production:
 * Take user input, request db_dump from database, parse resulting db dump, pass parsed data to next middleware.
 *
 * Option2 - Dev: Use .sql file provided in db_schema and parse, pass parsed data to next middleware.
 */
mySQLdataController.getSchema = async (req, res, next) => {
  // // Option 1 - Production
  // let result = null;
  //use mysqldump to download mysql db schema
  try {
    const result = await mysqldump({
      connection: {
        host: req.body.hostname,
        port: req.body.port,
        user: req.body.username,
        password: req.body.password,
        database: req.body.database_name,
      },
    });
    res.locals.data = result;
    const { tables } = result;
    // console.log(tables);
    next();
  } catch (error) {
    next({ message: 'Error with getSchema middleware' });
  }
};

/**
 * objSchema
 * Iterates through testdata array of tables and grabs table name.
 * Iterates through properties array and assigns field name as key for properties.
 */
mySQLdataController.objSchema = (req, res, next) => {
  const db = res.locals.data;
  const { tables } = db;
  const results = {};

  //create Table class
  function TableModel(name) {
    this.key = name;
  }

  //create Properties class
  function PropertyModel(name) {
    this.Name = name;
    this.Value = null;
    this.data_type = 'varchar';
    this.TableName = null;
    this.References = [];
    this.IsPrimaryKey = false;
    this.IsForeignKey = false;
    this.additional_constraints = 'NA';
    this.field_name = name;
  }

  // Handles all columns the primary key
  function PrimaryKeyModel() {
    this.PrimaryKeyName = null;
    this.PrimaryKeyTableName = null;
  }

  //append tables and table properties to results
  tables.forEach((table) => {
    //check if table or view
    if (!table.isView) {
      //get primary keys
      let pKeys = table.schema.slice(table.schema.indexOf('PRIMARY KEY') + 13);
      pKeys = pKeys.slice(0, pKeys.indexOf(')'));
      if (pKeys.includes(',')) pKeys = pKeys.split(', ');
      else pKeys = [pKeys];
      const primaryKeys = pKeys.map((key) => key.slice(1, -1));

      //get foreign keys
      let fKeys = table.schema.slice(table.schema.indexOf('FOREIGN KEY') + 13);
      fKeys = fKeys.slice(0, fKeys.indexOf(')'));
      if (fKeys.includes(',')) fKeys = fKeys.split(', ');
      else fKeys = [fKeys];
      const foreignKeys = fKeys.map((key) => key.slice(1, -1));

      //create new table
      results[table.name] = new TableModel(table.name);

      //create new table properties
      table.columnsOrdered.forEach((propName) => {
        const newProp = new PropertyModel(propName);
        newProp.TableName = table.name;
        //check if primary key
        if (primaryKeys.includes(newProp.Name)) newProp.IsPrimaryKey = true;
        //check if foreign key
        if (foreignKeys.includes(newProp.Name)) newProp.IsForeignKey = true;
        newProp.field_name = newProp.Name;
        newProp.data_type = table.columns[newProp.Name].type;
        //STILL NEED: additional_constraints
        //STILL NEED: References
        //push new property into properties array
        results[table.name][newProp.Name] = newProp;
      });
    }
  });

  // Handles all columns of the foreign key
  function ForeignKeyModel() {
    this.PrimaryKeyName = null;
    this.ReferencesPropertyName = null;
    this.PrimaryKeyTableName = null;
    this.ReferencesTableName = null;
    this.IsDestination = false;
  }

  res.locals.data = results;
  return next();
};

//   for (let i = 0; i < data.length; i++) {
//     // this outer loop will iterate through tables within data
//     const properties = {};
//     for (let k = 0; k < data[i].Properties.length; k++) {
//       const key = data[i].Properties[k].field_name;
//       properties[key] = data[i].Properties[k];
//     }
//     results[data[i].Name] = properties;
//   }

//   res.locals.result = results;
//   next();
// };

// function TableModel() {
//   this.Name = null;
//   this.Properties = [];
// }

// // Handles all columns of a table
// function PropertyModel() {
//   this.Name = null;
//   this.Value = null;
//   this.TableName = null;
//   this.References = [];
//   this.IsPrimaryKey = false;
//   this.IsForeignKey = false;
// }

// function ForeignKeyModel() {
//   this.PrimaryKeyName = null;
//   this.ReferencesPropertyName = null;
//   this.PrimaryKeyTableName = null;
//   this.ReferencesTableName = null;
//   this.IsDestination = false;
// }

// function PrimaryKeyModel() {
//   this.PrimaryKeyName = null;
//   this.PrimaryKeyTableName = null;
// }

// // Creating global empty arrays to hold foreign keys, primary keys, and tableList
// foreignKeyList = [];
// primaryKeyList = [];
// tableList = [];

// /*  Function Section   */

// // Creates propertyModel and assigns properties to arguments passed in
// function createProperty(name, tableName, foreignKey, isPrimaryKey) {
//   const property = new PropertyModel();
//   const isForeignKey = foreignKey !== undefined && foreignKey !== null;
//   property.Name = name;
//   property.TableName = tableName;
//   property.IsForeignKey = isForeignKey;
//   property.IsPrimaryKey = isPrimaryKey;
//   return property;
// }

// // Creates a new table with name property assigned to argument passed in
// function createTable(name) {
//   const table = new TableModel();
//   table.Name = name;
//   // Increment exported tables count
//   exportedTables++;
//   return table;
// }

// // Creates foreignKeyModel and asReferencesProsigns properties to arguments passed in
// function createForeignKey(
//   primaryKeyName,
//   primaryKeyTableName,
//   referencesPropertyName,
//   referencesTableName,
//   isDestination
// ) {
//   const foreignKey = new ForeignKeyModel();
//   foreignKey.PrimaryKeyTableName = primaryKeyTableName;
//   foreignKey.PrimaryKeyName = primaryKeyName;
//   foreignKey.ReferencesPropertyName = referencesPropertyName;
//   foreignKey.ReferencesTableName = referencesTableName;
//   foreignKey.IsDestination =
//     isDestination !== undefined && isDestination !== null
//       ? isDestination
//       : false;
//   return foreignKey;
// }

// // Creates primaryKeyModel and assigns properties to arguments passed in
// function createPrimaryKey(primaryKeyName, primaryKeyTableName) {
//   const primaryKey = new PrimaryKeyModel();
//   primaryKey.PrimaryKeyTableName = primaryKeyTableName;
//   primaryKey.PrimaryKeyName = primaryKeyName;
//   return primaryKey;
// }

// // Parses foreign key with SQL Server syntax
// function parseSQLServerForeignKey(name, currentTableModel, propertyType) {
//   // Regex expression to find referenced foreign table
//   const referencesIndex = name.match(
//     /(?<=REFERENCES\s)([a-zA-Z_]+)(\([a-zA-Z_]*\))/
//   );

//   // Match element at index 1 references table names
//   const referencedTableName = referencesIndex[1];
//   const referencedPropertyName = referencesIndex[2].replace(/\(|\)/g, '');

//   // Remove everything after 'foreign key' from line
//   const foreignKeyLabelIndex = name.toLowerCase().indexOf('foreign key');
//   let foreignKey = name.slice(0, foreignKeyLabelIndex).trim();

//   // If 'primary key' exists in line, remove 'primary key'
//   const primaryKeyLabelIndex = name.toLowerCase().indexOf('primary key');
//   if (primaryKeyLabelIndex >= 0) {
//     foreignKey = foreignKey.slice(0, primaryKeyLabelIndex).trim();
//   }

//   // Create ForeignKey with IsDestination = false
//   const foreignKeyOriginModel = createForeignKey(
//     foreignKey,
//     currentTableModel.Name,
//     referencedPropertyName,
//     referencedTableName,
//     false
//   );

//   // Add ForeignKey Origin
//   foreignKeyList.push(foreignKeyOriginModel);

//   // Create ForeignKey with IsDestination = true
//   const foreignKeyDestinationModel = createForeignKey(
//     referencedPropertyName,
//     referencedTableName,
//     foreignKey,
//     currentTableModel.Name,
//     true
//   );

//   // Add ForeignKey Destination
//   foreignKeyList.push(foreignKeyDestinationModel);

//   // Create Property
//   const propertyModel = createProperty(
//     foreignKey,
//     currentTableModel.Name,
//     null,
//     false
//   );

//   // If property is both primary key and foreign key, set IsPrimaryKey property to true
//   if (propertyType === 'SQLServer both') {
//     propertyModel.IsPrimaryKey = true;
//   }

//   // Add Property to table
//   currentTableModel.Properties.push(propertyModel);
// }

// function parseMySQLForeignKey(name, currentTableModel, constrainName = null) {
//   name = name.replace(/\"/g, '');

//   let foreignKeyName = name
//     .match(/(?<=FOREIGN\sKEY\s)(\([A-Za-z0-9_]+\))(?=\sREFERENCES\s)/)[0]
//     .replace(/\(|\)/g, '');
//   const referencedTableName = name.match(
//     /(?<=REFERENCES\s)([A-Za-z0-9_]+\.[A-Za-z0-9_]+)+/
//   )[0];
//   // let constraintname = name.match(/(?<=CONSTRAINT\s)([A-Za-z0-9_]+)/)[0];
//   let referencedPropertyName = name
//     .match(/(?<=REFERENCES\s)([A-Za-z0-9_]+\.[A-Za-z0-9_()]+)+/)[0]
//     .match(/\(([^()]+)\)/g)[0]
//     .replace(/\(|\)/g, '');

//   // Look through current table and reassign isForeignKey prop to true, reassign foreignKeyName to include type
//   currentTableModel.Properties.forEach((property) => {
//     if (property.Name.split(' ')[0] === foreignKeyName) {
//       property.IsForeignKey = true;
//       foreignKeyName = property.Name;
//     }
//   });

//   let primaryTableModel = null;

//   const tlKeys = Object.keys(tableList);
//   for (let i = 0; i < tlKeys.length; i++) {
//     if (tableList[tlKeys[i]].Name === referencedTableName) {
//       primaryTableModel = tableList[tlKeys[i]];
//       break;
//     }
//   }

//   const ptmKeys = Object.keys(primaryTableModel);
//   for (let i = 0; i < ptmKeys.length; i++) {
//     const ptmSubKeys = Object.keys(primaryTableModel[ptmKeys[i]]);
//     for (let j = 0; j < ptmSubKeys.length; j++) {
//       if (
//         primaryTableModel[ptmKeys[i]][ptmSubKeys[j]].Name !== undefined &&
//         primaryTableModel[ptmKeys[i]][ptmSubKeys[j]].Name.indexOf(
//           referencedPropertyName
//         ) !== -1
//       ) {
//         referencedPropertyName =
//           primaryTableModel[ptmKeys[i]][ptmSubKeys[j]].Name;
//         break;
//       }
//     }
//   }

//   // Add PrimaryKey Origin
//   // foreignKeyList.push(primaryKeyOriginModel);

//   // Create ForeignKey
//   let foreignKeyDestinationModel = createForeignKey(
//     referencedPropertyName,
//     referencedTableName,
//     foreignKeyName,
//     currentTableModel.Name,
//     false
//   );

//   foreignKeyDestinationModel.constrainName = constrainName;
//   // Add ForeignKey Destination
//   foreignKeyList.push(foreignKeyDestinationModel);
// }

// // Iterates through primaryKeyList and checks every property in every table
// // If primaryKeyList.Name === propertyModel.Name, set IsPrimaryKey property to true
// function processPrimaryKey() {
//   primaryKeyList.forEach(function (primaryModel) {
//     tableList.forEach(function (tableModel) {
//       if (tableModel.Name === primaryModel.PrimaryKeyTableName) {
//         tableModel.Properties.forEach(function (propertyModel) {
//           if (propertyModel.Name === primaryModel.PrimaryKeyName) {
//             propertyModel.IsPrimaryKey = true;
//           }
//         });
//       }
//     });
//   });
// }

// // Iterates through foreignKeyList and checks every property in every table
// // If propertyModel's name equals what the foreignKeyModel is referencing, set propertyModel.IsForeignKey to true and add foreignKeyModel to propertyModel.References array
// function processForeignKey() {
//   foreignKeyList.forEach(function (foreignKeyModel) {
//     tableList.forEach(function (tableModel) {
//       if (tableModel.Name === foreignKeyModel.ReferencesTableName) {
//         tableModel.Properties.forEach(function (propertyModel) {
//           if (propertyModel.Name === foreignKeyModel.ReferencesPropertyName) {
//             propertyModel.IsForeignKey = true;
//             propertyModel.References.push(foreignKeyModel);
//           }
//         });
//       }
//       if (tableModel.Name == foreignKeyModel.PrimaryKeyTableName) {
//         tableModel.Properties.forEach(function (propertyModel) {
//           if (propertyModel.Name === foreignKeyModel.PrimaryKeyName) {
//             propertyModel.References.push({
//               PrimaryKeyName: foreignKeyModel.PrimaryKeyName,
//               ReferencesPropertyName: foreignKeyModel.ReferencesPropertyName,
//               PrimaryKeyTableName: foreignKeyModel.PrimaryKeyTableName,
//               ReferencesTableName: foreignKeyModel.ReferencesTableName,
//               IsDestination: true,
//               constrainName: foreignKeyModel.constrainName,
//             });
//           }
//         });
//       }
//     });
//   });
// }

// // Parses table name from CREATE TABLE line
// function parseSQLServerName(name, property) {
//   name = name.replace('[dbo].[', '');
//   name = name.replace('](', '');
//   name = name.replace('].[', '.');
//   name = name.replace('[', '');
//   if (property == undefined || property == null) {
//     name = name.replace(' [', '');
//     name = name.replace('] ', '');
//   } else {
//     if (name.indexOf(']') !== -1) {
//       name = name.substring(0, name.indexOf(']'));
//     }
//   }
//   if (name.lastIndexOf(']') === name.length - 1) {
//     name = name.substring(0, name.length - 1);
//   }
//   if (name.lastIndexOf(')') === name.length - 1) {
//     name = name.substring(0, name.length - 1);
//   }
//   if (name.lastIndexOf('(') === name.length - 1) {
//     name = name.substring(0, name.length - 1);
//   }
//   name = name.replace(' ', '');
//   return name;
// }

// // Checks whether CREATE TABLE query has '(' on separate line
// function parseTableName(name) {
//   if (name.charAt(name.length - 1) === '(') {
//     name = parseSQLServerName(name);
//   }
//   return name;
// }

// function parseAlterTable(tableName, constraint) {
//   const regexConstraint = /(?<=CONSTRAINT\s)([a-zA-Z_]+)/;
//   const constrainName = constraint.match(regexConstraint);

//   tableName = tableName.trim();
//   let currentTableModel;
//   tableList.forEach((tableModel) => {
//     if (tableModel.Name === tableName) {
//       currentTableModel = tableModel;
//     }
//   });

//   if (constraint.indexOf('FOREIGN KEY') !== -1) {
//     const name = constraint.substring(
//       constraint.indexOf('FOREIGN KEY'),
//       constraint.length - 1
//     );
//     parseMySQLForeignKey(
//       name,
//       currentTableModel,
//       constrainName !== null ? constrainName[0] : null
//     );
//   } else if (constraint.indexOf('PRIMARY KEY') !== -1) {
//     const name = constraint.substring(
//       constraint.indexOf('PRIMARY KEY'),
//       constraint.length - 1
//     );
//     parseMYSQLPrimaryKey(name, currentTableModel);
//   }
// }

// function parseSQLServerPrimaryKey(name, currentTableModel, propertyType) {
//   const primaryKey = name
//     .replace('PRIMARY KEY (', '')
//     .replace(')', '')
//     .replace('PRIMARY KEY', '')
//     .replace(/\"/g, '')
//     .trim();

//   // Create Primary Key
//   const primaryKeyModel = createPrimaryKey(primaryKey, currentTableModel.Name);

//   // Add Primary Key to List
//   primaryKeyList.push(primaryKeyModel);

//   // Create Property
//   const propertyModel = createProperty(
//     primaryKey,
//     currentTableModel.Name,
//     null,
//     true
//   );

//   // Add Property to table if not both primary key and foreign key
//   // If both, property is added when parsing foreign key
//   if (propertyType !== 'SQLServer both') {
//     currentTableModel.Properties.push(propertyModel);
//   }
// }

// function parseMYSQLPrimaryKey(name, currentTableModel) {
//   const primaryKeyName = name.slice(13).replace(')', '').replace(/\"/g, '');

//   currentTableModel.Properties.forEach((property) => {
//     if (property.Name.split(' ')[0] === primaryKeyName) {
//       property.IsPrimaryKey = true;
//       primaryKeyList.push(property);
//     }
//   });
// }

// // Takes in SQL creation file as text, then parses
// function parseSql(text) {
//   const lines = text.split('\n');
//   let tableCell = null;
//   let cells = [];
//   exportedTables = 0;
//   tableList = [];
//   foreignKeyList = [];
//   primaryKeyList = [];

//   let currentTableModel = null;

//   // Parse SQL to objects
//   for (let i = 0; i < lines.length; i++) {
//     let rowCell = null;

//     const tmp = lines[i].trim();

//     const propertyRow = tmp.substring(0, 12).toLowerCase().trim();

//     if (currentTableModel !== null && tmp.includes(');')) {
//       tableList.push(currentTableModel);
//       currentTableModel = null;
//     }

//     // Parse Table
//     if (propertyRow === 'create table') {
//       // Parse row
//       let name = tmp.substring(12).trim();

//       // Parse Table Name
//       name = parseTableName(name);

//       // Create Table
//       currentTableModel = createTable(name);
//     }
//     // tmp === 'ALTER TABLE'
//     else if (propertyRow == 'alter table') {
//       let alterQuerySplit = tmp.toLowerCase().trim();
//       let tname = null;

//       for (let i = 0; i < tableList.length; i++) {
//         if (alterQuerySplit.indexOf(tableList[i].Name) !== -1) {
//           tname = tableList[i].Name;
//         }
//       }
//       //check for TableName and following line with constraint bound on database
//       if (tname !== null && lines[i + 1] !== null)
//         parseAlterTable(tname, lines[i + 1]);
//       i += 3;
//     }

//     // Parse Properties Primarily for field props of Tables
//     else if (
//       tmp !== '(' &&
//       currentTableModel !== null &&
//       propertyRow !== 'alter table '
//     ) {
//       // Parse the row
//       let name = tmp.substring(
//         0,
//         tmp.charAt(tmp.length - 1) === ',' ? tmp.length - 1 : tmp.length
//       );
//       // Check if first 10 characters are 'constraint'
//       const constraint = name.substring(0, 10).toLowerCase();
//       if (constraint === 'constraint') {
//         // double checking for constraints here
//         if (name.indexOf('PRIMARY KEY') !== -1) {
//           name = name
//             .substring(name.indexOf('PRIMARY KEY'), name.length)
//             .replace(/\"/g, '');
//         } else if (name.indexOf('FOREIGN KEY') !== -1) {
//           name = name
//             .substring(name.indexOf('FOREIGN KEY'), name.length)
//             .replace(/\"/g, '');
//         }
//       }

//       // Attempt to get the Key Type
//       let propertyType = name.substring(0, 11).toLowerCase();
//       // Add special constraints
//       if (propertyType !== 'primary key' && propertyType !== 'foreign key') {
//         if (
//           tmp.indexOf('PRIMARY KEY') !== -1 &&
//           tmp.indexOf('FOREIGN KEY') !== -1
//         ) {
//           propertyType = 'SQLServer both';
//         } else if (tmp.indexOf('PRIMARY KEY') !== -1) {
//           propertyType = 'SQLServer primary key';
//         } else if (tmp.indexOf('FOREIGN KEY') !== -1) {
//           propertyType = 'SQLServer foreign key';
//         }
//       }
//       // Verify if this is a property that doesn't have a relationship (One minute of silence for the property)
//       let normalProperty =
//         propertyType !== 'primary key' &&
//         propertyType !== 'foreign key' &&
//         propertyType !== 'SQLServer primary key' &&
//         propertyType !== 'SQLServer foreign key' &&
//         propertyType !== 'SQLServer both';
//       // Parse properties that don't have relationships
//       if (normalProperty) {
//         // For now, skip lines with these commands
//         if (
//           name.indexOf('ASC') !== -1 ||
//           name.indexOf('DESC') !== -1 ||
//           name.indexOf('EXEC') !== -1 ||
//           name.indexOf('WITH') !== -1 ||
//           name.indexOf('ON') !== -1 ||
//           name.indexOf('ALTER') !== -1 ||
//           name.indexOf('/*') !== -1 ||
//           name.indexOf('CONSTRAIN') !== -1 ||
//           name.indexOf('SET') !== -1 ||
//           name.indexOf('NONCLUSTERED') !== -1 ||
//           name.indexOf('GO') !== -1 ||
//           name.indexOf('REFERENCES') !== -1 ||
//           name.indexOf('OIDS') !== -1
//         ) {
//           continue;
//         }

//         // Takes quotation marks out of normal property names
//         name = name.replace(/\"/g, '');

//         // Create Property
//         let propertyModel = createProperty(
//           name,
//           currentTableModel.Name,
//           null,
//           false,
//           false
//         );

//         // Add Property to table
//         currentTableModel.Properties.push(propertyModel);
//       }

//       // Parse Primary Key
//       if (
//         propertyType === 'primary key' ||
//         propertyType === 'SQLServer primary key' ||
//         propertyType === 'SQLServer both'
//       ) {
//         // Parse Primary Key from SQL Server syntax
//         if (
//           propertyType === 'SQLServer primary key' ||
//           propertyType === 'SQLServer both'
//         ) {
//           if (
//             name.indexOf('PRIMARY KEY') !== -1 &&
//             name.indexOf('CLUSTERED') === -1
//           ) {
//             parseSQLServerPrimaryKey(name, currentTableModel, propertyType);
//           }

//           // Parsing primary key from MySQL syntax
//         } else if (propertyType === 'primary key') {
//           parseMYSQLPrimaryKey(name, currentTableModel);
//         }
//       }

//       // Parse Foreign Key
//       if (
//         propertyType === 'foreign key' ||
//         propertyType === 'SQLServer foreign key' ||
//         propertyType === 'SQLServer both'
//       ) {
//         // Parse Foreign Key from SQL Server syntax
//         if (
//           propertyType === 'SQLServer foreign key' ||
//           propertyType === 'SQLServer both'
//         ) {
//           let completeRow = name;
//           if (name.indexOf('REFERENCES') === -1) {
//             const referencesRow = lines[i + 1].trim();
//             completeRow =
//               'ALTER TABLE [dbo].[' +
//               currentTableModel.Name +
//               ']  WITH CHECK ADD' +
//               ' ' +
//               name +
//               ' ' +
//               referencesRow;
//           }
//           parseSQLServerForeignKey(
//             completeRow,
//             currentTableModel,
//             propertyType
//           );
//         } else {
//           parseMySQLForeignKey(name, currentTableModel);
//         }
//       }
//     }
//   }

//   // Process Primary Keys
//   processPrimaryKey();

//   // Process Foreign Keys
//   processForeignKey();

//   for (let i in tableList) {
//     for (let k in tableList[i].Properties) {
//       if (tableList[i].Properties[k] !== undefined) {
//         let composite =
//           tableList[i].Properties[k].Name.match(/^(\S+)\s(.*)/).slice(1);

//         let value = composite[1].search(/NOT/i);
//         if (value > 0) {
//           let type = composite[1].substring(0, value - 1);
//           let additional_constraints = composite[1].substring(value);

//           tableList[i].Properties[k].field_name = composite[0];
//           tableList[i].Properties[k].data_type = type;
//           tableList[i].Properties[k].additional_constraints =
//             additional_constraints;
//         } else {
//           let type = composite[1].substring(value);
//           let additional_constraints = null;
//           tableList[i].Properties[k].field_name = composite[0];
//           tableList[i].Properties[k].data_type = type;
//           tableList[i].Properties[k].additional_constraints =
//             additional_constraints;
//         }
//       }
//     }
//   }

//   return tableList;
// }

// /*  Function
//       Section   */

// function createTableUI() {
//   tableList.forEach(function (tableModel) {
//     // Push in string code to d3tables array to render table name as a row
//     for (let ref in tableModel.Properties);
//   });

//   return tableList;
// }
// // functions to handle mouseover to depict related tables only

// // Adding Primary Key and Foreign Key designations for table columns
// function checkSpecialKey(propertyModel) {
//   if (propertyModel.IsForeignKey && propertyModel.IsPrimaryKey) {
//     return 'PK | FK';
//   } else if (propertyModel.IsForeignKey) {
//     return 'FK';
//   } else if (propertyModel.IsPrimaryKey) {
//     return 'PK';
//   } else {
//     return '';
//   }
// }

// mySQLdataController.getAllSchemas = (req, res) => {};

// mySQLdataController.openSchema = (req, res, next) => {
//   fs.readFile(
//     '/Users/phoenix/Documents/GitHub/osp/JAKT/server/db_schemas/vjcmcautvjcmcaut1657127402.sql',
//     'utf8',
//     (error, data) => {
//       if (error) {
//         console.error(`error- in FS: ${error.message}`);
//         return next({
//           msg: 'Error reading database schema file',
//           err: error,
//         });
//       }
//       let result = parseSql(data);
//       next();
//     }
//   );
// };

// mySQLdataController.postSchema = (req, res) => {};

// mySQLdataController.handleQueries = async (req, res, next) => {
//   /* Assumption, being passed an array of queries in req.body
//   //Note: Have to configure front-end for mySqlCredentials

//   Loop through array of queries and add them to a query string, if return query, add their outputs to the query string instead

//   Execute the resulting query string as a transaction */

//   /**
//    * Handshake block
//    */
//   // Production values
//   const { mySqlCredentials, queries } = req.body;
//   const { hostname, port, username, password, databaseName } = mySqlCredentials;

//   /**
//    * Function definition and initialization block
//    */
//   const pool = mysql.createPool({
//     host: hostname,
//     port: port,
//     user: username,
//     password: password,
//     database: databaseName,
//   });

//   const execQueries = (text, params, callback) => {
//     return pool.query(text, params, callback);
//   };

//   //NOTE: STILL NEED TO UPDATE THIS FUNCTION TO MYSQL SYNTAX
//   const transactionQuery = async (queryString) => {
//     const client = await pool.connect();
//     try {
//       await client.query('BEGIN');
//       for (let i = 0; i < arrQS.length - 1; i++) {
//         await client.query(arrQS[i]);
//       }
//       await client.query('COMMIT');
//     } catch (err) {
//       console.log({ err }, '<err\n\n');
//       console.log(
//         '--Invalid query detected in handleQueries\n--Transaction declined'
//       );
//       await client.query('ROLLBACK');
//       throw err;
//     } finally {
//       client.release();
//     }
//   };

//   /**
//    * Build out query string
//    * Iterates through queries and conditionally adds either the query or the output of the query to queryStr
//    */
//   let queryStr = '';
//   for (let i = 0; i < queries.length; i++) {
//     if (queries[i].type === 'returnQuery') {
//       // execute & whatever returns, we concat to queryStr
//       const newQuery = await execQueries(queries[i].query);
//       queryStr = queryStr.concat(newQuery);
//     } else queryStr = queryStr.concat(queries[i].query);
//   }

//   /**
//    * Transaction implementation
//    * Wraps the query string in BEGIN and COMMIT to ensure that the queries are either all execute, or none do.
//    * CANNOT JUST WRAP THE QUERY IN BEGIN AND COMMIT AS PER node-postgres documentation.
//    */
//   res.locals.success = false;

//   const arrQS = queryStr.split(';');
//   for (let i = 0; i < arrQS.length; i++) {
//     arrQS[i] += ';';
//   }
//   transactionQuery(arrQS)
//     .then(() => {
//       res.locals.success = true;
//       return next();
//     })
//     .catch((err) => {
//       next({
//         log: 'Error in handleQueries middleware',
//         message: { err: err },
//       });
//     });
// };

// mySQLdataController.saveSchema = (req, res) => {};
// mySQLdataController.deleteSchema = (req, res) => {};

module.exports = mySQLdataController;
