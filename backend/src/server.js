require('module-alias/register');
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

// Make sure we are running node 20+
const [major] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  console.log('Please upgrade your Node.js version to 20 or greater.');
  process.exit();
}

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.DATABASE);

mongoose.connection.on('error', (error) => {
  console.log('Check your backend .env DATABASE value first.');
  console.error(`MongoDB connection error: ${error.message}`);
});

const modelsFiles = globSync('./src/models/**/*.js');

for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

const app = require('./app');
app.set('port', process.env.PORT || 8888);

app.listen(app.get('port'), () => {
  console.log(`Express running on PORT : ${app.get('port')}`);
});
