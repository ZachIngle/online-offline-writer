const Web3 = require('web3');
const java = require('java');
const path = require('path');
const { hrtime } = require('process');

// web3 setup
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8000'));

// java setup
const jarPath = path.join(__dirname, 'ChameleonHash.jar');
java.classpath.push(jarPath);
const ChameleonHash = java.import('ChameleonHash');
const BigInteger = java.import('java.math.BigInteger');

const KEY_SIZE = 2048;
const NS_PER_SEC = 1e9;

const FIRST_MESSAGE = "1234567890123456789";
const SECOND_MESSAGE = "9876543210987654321";

let address;
let privateKey;
let pp;
let hashSecretKey;
let hashPublicKey;

// Transactions structure;
// {
//   txhash: "",
//   m: "",
//   r: "",
//   hash: "", // or v
// }

function init(_address, _privateKey) {
  address = _address;
  privateKey = _privateKey;

  pp = java.newArray('java.math.BigInteger', ChameleonHash.setupSync(KEY_SIZE)); // Cast into BigInteger[]
  keys = ChameleonHash.keyGenSync(pp[0], pp[1], pp[2], KEY_SIZE);
  hashSecretKey = keys[0];
  hashPublicKey = keys[1];
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testChain(numberOfTransactions, TPS) {
  console.log(`Starting test with ${numberOfTransactions} transactions at roughly ${TPS} TPS`);
  const timeBetweenTransactions = 1000 / TPS;
  let droppedTransactions = 0;
  let lastTransaction;

  const startTransactionCount = await web3.eth.getTransactionCount(address); 
  const startPendingTransactionCount = await web3.eth.getTransactionCount(address, 'pending');
  
  const start = hrtime();
  for (let n = 0; n < numberOfTransactions; n++) {
    lastTransaction = web3.eth.accounts.signTransaction({
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
    .catch((error) => { console.log('Transaction failed'); console.log(error); droppedTransactions++ })
    
    await timeout(timeBetweenTransactions);
  }
  
  const sentDiff = hrtime(start);
  const sentTimeTaken = sentDiff[0] + (sentDiff[1] / NS_PER_SEC);
  console.log(`Total number of dropped transactions: ${droppedTransactions}`);
  console.log(`Sent TPS: ${(numberOfTransactions - droppedTransactions) / sentTimeTaken}`);
  
  console.log('Waiting for all transactions to be confirmed...')
  await lastTransaction;
  
  const confirmedDiff = hrtime(start);
  const confirmedTimeTaken = confirmedDiff[0] + (confirmedDiff[1] / NS_PER_SEC);
  
  console.log(`Confirmed time taken: ${confirmedTimeTaken}`);
  console.log(`Confirmed TPS: ${(numberOfTransactions - droppedTransactions) / confirmedTimeTaken}`);
}

function createDummyTransactions(numberOfDummyTransactions) {
  const m = new BigInteger(FIRST_MESSAGE);
  const transactions = [];
  
  console.log(`Creating ${numberOfDummyTransactions} dummy transactions...`);

  const start = hrtime();
  for(let i = 0; i < numberOfDummyTransactions; i++) {
    const [, r, v] = ChameleonHash.hashSync(m, hashPublicKey, pp);
    const dummyTransaction = {
      txhash: null,
      m,
      r,
      v,
    }

    const ch = java.newArray('java.math.BigInteger', [m, r, v]);
    
    if (ChameleonHash.verifySync(hashPublicKey, ch, pp)) {
      transactions.push(dummyTransaction);
    }
  }
  const diff = hrtime(start);
  const timeTaken = diff[0] + (diff[1] / NS_PER_SEC); 

  console.log(`Created and verified ${numberOfDummyTransactions} dummy transactions...`);
  console.log(`Took ${timeTaken} seconds`);

  return transactions;
}

async function sendDummyTransactions(transactions, TPS = 200) {
  console.log(`Sending dummy transations at roughly ${TPS} TPS`);

  const startPendingTransactionCount = await web3.eth.getTransactionCount(address, 'pending');
  const timeBetweenTransactions = 1000 / TPS;
  let lastTransaction;

  const start = hrtime();
  for (let i = 0; i < transactions.length; i++) {
    lastTransaction = web3.eth.accounts.signTransaction({
      data: web3.utils.toHex(transactions[i].v),
      gas: '1000000',
      nonce: startPendingTransactionCount + i,
    }, privateKey)
    .then(({ rawTransaction }) => web3.eth.sendSignedTransaction(rawTransaction, function(error, hash) {
      if (!error) {
        transactions[i].txhash = hash;
      } else {
        console.log(error)
      }
    }))
    .catch((error) => console.log(error))

    await timeout(timeBetweenTransactions);
  }

  const sentDiff = hrtime(start);
  const sentTimeTaken = sentDiff[0] + (sentDiff[1] / NS_PER_SEC);

  console.log('Sent all dummy transations'); 
  console.log(`Sent TPS: ${(transactions.length) / sentTimeTaken}`);
  
  console.log('Waiting for all to be confirmed...');
  
  await lastTransaction;

  console.log('All transactions confirmed');
  const confirmedDiff = hrtime(start);
  const confirmedTimeTaken = confirmedDiff[0] + (confirmedDiff[1] / NS_PER_SEC);
  console.log(`Confirmed time taken: ${confirmedTimeTaken}`); 
  console.log(`Confirmed TPS: ${(transactions.length) / confirmedTimeTaken}`);
}

function changeTransactions(transactions) {
  const mPrime = new BigInteger(SECOND_MESSAGE);
  
  console.log(`Changing dummy transactions`);

  const start = hrtime();
  const changedTransactions = transactions.map(({ txhash, m, r, v }) => {
    const ch = java.newArray('java.math.BigInteger', [m, r, v]);
    ChameleonHash.adaptSync(mPrime, hashSecretKey, ch, pp);
    
    if(!ChameleonHash.verifySync(hashPublicKey, ch, pp)) {
      throw 'Invalid changed transaction';
    };

    return ({
      txhash,
      m: mPrime,
      r: ch[1],
      v
    })
  })

  const diff = hrtime(start);
  const timeTaken = diff[0] + (diff[1] / NS_PER_SEC); 

  console.log(`Changed ${transactions.length} dummy transactions...`);
  console.log(`Took ${timeTaken} seconds`);

  return changedTransactions; 
}

module.exports = {
  init,
  timeout,
  testChain,
  createDummyTransactions,
  sendDummyTransactions,
  changeTransactions,
};
