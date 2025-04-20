// Simple script to install connect-mongo if it's missing
import { exec } from 'child_process';
import fs from 'fs';

// Check if package.json exists
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Check if connect-mongo is already a dependency
  if (!packageJson.dependencies['connect-mongo']) {
    console.log('Installing connect-mongo package...');
    
    // Run npm install
    exec('npm install connect-mongo --save', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing connect-mongo: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      
      console.log(`stdout: ${stdout}`);
      console.log('connect-mongo successfully installed!');
    });
  } else {
    console.log('connect-mongo already installed.');
  }
} catch (err) {
  console.error('Error reading package.json:', err);
} 