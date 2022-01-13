const Web3 = require('web3');
const { hrtime } = require('process');
const NS_PER_SEC = 1e9;

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8000'));

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let address;
let privateKey;

function init(_address, _privateKey) {
  address = _address;
  privateKey = _privateKey;
}

// Send 50 transactions and see how quickly they get confirmed
async function calculate50TPS() {
  const pendingTransactionCount = await web3.eth.getTransactionCount(address, 'pending');
  const startTransactionCount = await web3.eth.getTransactionCount(address);

  const NUM_OF_TRANSACTIONS = 50;

  const start = hrtime();

  for (let n = 0; n < NUM_OF_TRANSACTIONS; n++) {
    web3.eth.accounts.signTransaction({
      data: web3.utils.toHex('Hello world'),
      gas: '1000000',
      nonce: pendingTransactionCount + n,
    }, privateKey).then(({ rawTransaction}) => web3.eth.sendSignedTransaction(rawTransaction, function(error, hash) {
      if (!error) {
        console.log('🎉 Transaction created');
      } else {
        console.log(error)
      }
    }));
  }

  let currentTransactionCount = await web3.eth.getTransactionCount(address);
  while (currentTransactionCount < startTransactionCount + NUM_OF_TRANSACTIONS) { 
    console.log('Retrying... ' + currentTransactionCount)
    await timeout(200)
    currentTransactionCount = await web3.eth.getTransactionCount(address); 
  }

  const diff = hrtime(start);
  const timeTaken = diff[0] + (diff[1] / NS_PER_SEC); 

  return NUM_OF_TRANSACTIONS / timeTaken;
}

async function testChain(numberOfTransactions, TPS) {
  console.log(`Starting test with ${numberOfTransactions} transactions at roughly ${TPS} TPS`);
  const timeBetweenTransactions = 1000 / TPS;
  let droppedTransactions = 0;

  const startTransactionCount = await web3.eth.getTransactionCount(address); 
  const startPendingTransactionCount = await web3.eth.getTransactionCount(address, 'pending');
  
  const start = hrtime();
  for (let n = 0; n < numberOfTransactions; n++) {
    web3.eth.accounts.signTransaction({
      data: web3.utils.toHex('Hello world'),
      gas: '1000000',
      nonce: startPendingTransactionCount + n,
    }, privateKey).then(({ rawTransaction}) => web3.eth.sendSignedTransaction(rawTransaction, function(error, hash) {
      if (!error) {
        // console.log('🎉 Transaction created');
      } else {
        console.log(error)
      }
    }))
    .catch((error) => { console.log('Transaction failed'); droppedTransactions++; })

    await timeout(timeBetweenTransactions);
  }

  const sentDiff = hrtime(start);
  const sentTimeTaken = sentDiff[0] + (sentDiff[1] / NS_PER_SEC);
  console.log(`Total number of dropped transactions: ${droppedTransactions}`);
  console.log(`Sent TPS: ${(numberOfTransactions - droppedTransactions) / sentTimeTaken}`);
  
  console.log('Waiting for all transactions to be confirmed...')
  let currentTransactionCount = await web3.eth.getTransactionCount(address);
  while (currentTransactionCount < startTransactionCount + numberOfTransactions) { 
    await timeout(200);
    currentTransactionCount = await web3.eth.getTransactionCount(address); 
  }

  const confirmedDiff = hrtime(start);
  const confirmedTimeTaken = confirmedDiff[0] + (confirmedDiff[1] / NS_PER_SEC);

  console.log(`Confirmed TPS: ${(numberOfTransactions - droppedTransactions) / confirmedTimeTaken}`);
}

module.exports = {
  init,
  timeout,
  calculate50TPS,
  testChain,
};
