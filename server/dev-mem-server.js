// Local-only helper: boots an in-memory MongoDB so the app can run on localhost
// with zero external setup (no Atlas account, no local mongod install).
// NOT used in production — index.js reads MONGODB_URI from .env as usual there.
// It also loads demo data with one account per role (scripts/seedDemo.js) and turns on
// demo mode, which lists those accounts on the login page.
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

(async () => {
  const mongod = await MongoMemoryServer.create({ instance: { dbName: 'examvault' } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.DEMO_MODE = '1';
  console.log('[dev] In-memory MongoDB started at', process.env.MONGODB_URI);

  mongoose.connection.once('open', async () => {
    try {
      const { seedDemo } = require('./scripts/seedDemo');
      const result = await seedDemo();
      if (!result.skipped) console.log(`[dev] Demo data loaded — ${result.accounts} accounts, pick one on the login page`);
    } catch (err) {
      console.error('[dev] Demo seed failed:', err);
    }
  });

  require('./index.js');
})();
