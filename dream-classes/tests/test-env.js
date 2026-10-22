// Shared isolated test environment. Each suite receives a fresh temporary
// database/uploads directory, so tests never destroy a developer's real data.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const projectDir = path.join(__dirname, '..');
const TEST_ADMIN_PASSWORD = 'TestAdminPassword@123';

function createTestContext(prefix = 'dream-classes-test-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    OTP_MODE: 'test',
    ALLOW_DEV_OTP: '1',
    OTP_RESEND_COOLDOWN_SECONDS: '0',
    OTP_MAX_PER_MOBILE_HOUR: '100',
    OTP_MAX_PER_IP_HOUR: '1000',
    JWT_SECRET: 'dream-classes-test-secret-not-for-production',
    ADMIN_EMAIL: 'admin@dreamclasses.in',
    ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
    MIGRATE_LEGACY_DB: '0',
    DATA_DIR: path.join(root, 'data'),
    UPLOADS_DIR: path.join(root, 'uploads')
  };
  const seed = spawnSync('node', ['seed.js'], { cwd: projectDir, env, encoding: 'utf8' });
  if (seed.status !== 0) {
    fs.rmSync(root, { recursive: true, force: true });
    throw new Error('Test seed failed:\n' + (seed.stdout || '') + (seed.stderr || ''));
  }
  return {
    root,
    env,
    dbPath: path.join(root, 'data', 'dream.db'),
    adminPassword: TEST_ADMIN_PASSWORD,
    cleanup() { fs.rmSync(root, { recursive: true, force: true }); }
  };
}

module.exports = { createTestContext, TEST_ADMIN_PASSWORD };
