const java = require('java');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8000'));
const path = require('path');

const jarPath = path.join(__dirname, 'ChameleonHash.jar');
java.classpath.push(jarPath);

const KEY_SIZE = 2048;

const node1 = '';
const wallet1 = '';

const node2 = '';
const wallet2 = '';

const ChameleonHash = java.import('ChameleonHash');
const BigInteger = java.import('java.math.BigInteger');

const m = new BigInteger('123456789');
const pp = java.newArray('java.math.BigInteger', ChameleonHash.setupSync(KEY_SIZE)); // Cast into BigInteger[]

const key = ChameleonHash.keyGenSync(pp[0], pp[1], pp[2], KEY_SIZE);
const sk = key[0];
const pk = key[1];
console.log(pp);
const hash = ChameleonHash.hashSync(m, pk, pp);
console.log(hash[0].toStringSync());
const hashArr = java.newArray('java.math.BigInteger', [m, hash[1], hash[2]]);
console.log(hashArr)
console.log(ChameleonHash.verifySync(pk, hashArr, pp));