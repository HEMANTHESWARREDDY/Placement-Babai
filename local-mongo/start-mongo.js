const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
  console.log('Starting MongoDB Memory Server...');
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'findmyjob'
    }
  });

  const uri = mongoServer.getUri();
  console.log(`\n========================================`);
  console.log(`MongoDB Memory Server is running!`);
  console.log(`URI: ${uri}`);
  console.log(`Port: 27017`);
  console.log(`Database: findmyjob`);
  console.log(`========================================\n`);

  process.on('SIGINT', async () => {
    console.log('Stopping MongoDB Memory Server...');
    await mongoServer.stop();
    process.exit(0);
  });
}

start().catch(err => {
  console.error('Failed to start MongoDB Memory Server:', err);
  process.exit(1);
});
