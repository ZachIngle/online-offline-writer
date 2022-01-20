const initAndStartBlockchain = require('./blockchain');
const { init, testChain } = require('./blockchainInterface');

async function start() {
  const { address, privateKey } = initAndStartBlockchain();

  init(address, privateKey);
  await testChain(10000, 200);
}

start();
