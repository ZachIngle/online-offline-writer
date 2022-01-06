const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8000'));

const keythereum = require('keythereum');
const keyobj = keythereum.importFromFile('0x05c7A90D29D2e43B53dad43E64d71405BaECaCA9', './node1');
const PRIVATE_KEY = keythereum.recover('1234', keyobj).toString('hex');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testChain(numberOfTransactions, TPS) {
  let n = 0;
  while (n < numberOfTransactions) {
    const curNonce = await web3.eth.getTransactionCount('0x05c7A90D29D2e43B53dad43E64d71405BaECaCA9', 'pending');
    await Promise.all(
      Array(25).fill().map(async (_, i) =>
        web3.eth.accounts.signTransaction({
          data: web3.utils.toHex(`dasdasdsdfd${n}`),
          gas: '1000000',
          nonce: curNonce + i,
        }, PRIVATE_KEY).then(({ rawTransaction }) => 
          web3.eth.sendSignedTransaction(rawTransaction, function(error, hash) {
            if (!error) {
              console.log("🎉 The hash of your transaction is: ", hash);
            } else {
              console.log("❗Something went wrong while submitting your transaction:", error)
            }
            }
          )
        )
      )
    )
  }
}

testChain();