const DashCoreInstance = require('./services/DashCoreInstance');

async function startDashcoreInstance() {
  const instances = await startDashcoreInstance.many(1);
  return instances[0];
}

startDashcoreInstance.many = async function many(number) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];
  for (let i = 0; i < number; i++) {
    const instance = new DashCoreInstance();
    instances.push(instance);
  }

  const promises = instances.map(instance => instance.start());
  await Promise.all(promises).catch((error) => {
    throw error;
  });

  return instances;
};

module.exports = startDashcoreInstance;
