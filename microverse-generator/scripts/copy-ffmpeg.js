const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/@ffmpeg/core/dist/umd');
const targetDir = path.join(__dirname, '../public/ffmpeg');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const filesToCopy = [
  'ffmpeg-core.js',
  'ffmpeg-core.wasm'
  // Note: ffmpeg-core.worker.js may not exist in all versions
];

filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✓ Copied ${file} to public/ffmpeg/`);
  } else {
    console.warn(`⚠ Warning: ${file} not found in ${sourceDir}`);
  }
});

