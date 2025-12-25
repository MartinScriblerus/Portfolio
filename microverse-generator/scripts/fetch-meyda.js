// downloads Meyda to public/vendor/meyda.min.js so the worker can import it
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '..', 'public', 'vendor');
const OUT_FILE = path.join(OUT_DIR, 'meyda.min.js');

// Try to respect the version declared in package.json; fall back to 'latest'
let declaredVersion = 'latest';
try {
  const pkg = require(path.resolve(__dirname, '..', 'package.json'));
  declaredVersion = (pkg.dependencies && pkg.dependencies.meyda) || (pkg.devDependencies && pkg.devDependencies.meyda) || 'latest';
  // strip semver ranges like ^ or ~
  declaredVersion = String(declaredVersion).replace(/^[^0-9]*/, '') || 'latest';
} catch (e) {
  // ignore
}

const candidateUrls = [
  `https://unpkg.com/meyda@${declaredVersion}/dist/web/meyda.min.js`,
  `https://unpkg.com/meyda@${declaredVersion}/dist/meyda.min.js`,
  `https://unpkg.com/meyda@${declaredVersion}/build/meyda.min.js`,
  `https://unpkg.com/meyda@${declaredVersion}/meyda.min.js`,
  `https://unpkg.com/meyda@${declaredVersion}` // try root (unpkg will redirect to a bundle)
];

async function ensureDir(dir) {
  return fs.promises.mkdir(dir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirects
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Failed to download ' + url + ' status ' + res.statusCode));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  try {
    await ensureDir(OUT_DIR);
    let lastErr = null;
    for (const url of candidateUrls) {
      try {
        console.log('Attempting Meyda download from', url);
        await download(url, OUT_FILE);
        console.log('Saved Meyda to', OUT_FILE);
        lastErr = null;
        break;
      } catch (err) {
        console.warn('Failed to download from', url, err.message || err);
        lastErr = err;
      }
    }
    if (lastErr) {
      throw lastErr;
    }
  } catch (err) {
    console.error('Failed to fetch Meyda:', err);
    console.error('Tried URLs:', candidateUrls.join('\n'));
    process.exitCode = 2;
  }
})();
