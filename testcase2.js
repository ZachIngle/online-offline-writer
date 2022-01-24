const initAndStartBlockchain = require('./blockchain');
const { init, testChain, createDummyTransactions, sendDummyTransactions, changeTransactions } = require('./blockchainInterface');

async function start() {
  const { address, privateKey } = initAndStartBlockchain();

  init(address, privateKey);
  
  // Off peak time
  const transactions = createDummyTransactions(5000);
  await sendDummyTransactions(transactions, 200);
  
  // On peak time
  changeTransactions(transactions);
  await testChain(5000, 200);
}

start();
