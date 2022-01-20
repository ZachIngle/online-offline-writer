const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const keythereum = require('keythereum');

const DATADIR = './tmp/node';
const PASSWORD = '1234';
const PASSWORD_FILE = './tmp/password';
const NODE_LOGFILE = './tmp/node.log';
const GENESIS_FILE = './tmp/genesis.json';
const GENESIS = {
  "config": {
    "chainId": 15,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0
  },
  "difficulty": "100000",
  "gasLimit": "0x8000000",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {},
};

// Create and initialize node with account
// Returns the address and private key
function initAndStartBlockchain() {
  spawnSync('rm', ['-rf', './tmp']);
  spawnSync('mkdir', ['./tmp']);
  spawnSync('mkdir', [DATADIR]);
  spawnSync('touch', [PASSWORD_FILE]);
  fs.writeFileSync(PASSWORD_FILE, PASSWORD);
  spawnSync('geth', ['--datadir', DATADIR, 'account', 'new', '--password', PASSWORD_FILE]);

  const accounts = fs.readdirSync(`${DATADIR}/keystore`);
  const address = `0x${JSON.parse(fs.readFileSync(`${DATADIR}/keystore/${accounts[0]}`, 'utf8')).address}`;

  GENESIS.alloc[address] = { balance: '99999999999999999999999999999999' };

  fs.writeFileSync(GENESIS_FILE, JSON.stringify(GENESIS, null, 4));
  spawnSync('geth', ['--datadir', DATADIR, 'init', GENESIS_FILE]);

  const logStream = fs.createWriteStream(NODE_LOGFILE, { flags: 'a' });

  const node = spawn('geth', [
    '--datadir', DATADIR, '--http', '--http.port', '8000', '--nodiscover', '--http.api', 
    '\"db,eth,net,web3,personal,miner,admin\"', '--networkid', '1900', '--port', '33333', '--mine', '--miner.threads=1',
    '--txpool.globalslots', '10000',
  ]);

  node.stdout.pipe(logStream);
  node.stderr.pipe(logStream);
  node.on('close', function (code) {
    console.log('geth node exited with code ' + code);
  });

  process.on('exit', function() {
    node.kill()
  });

  const keyobj = keythereum.importFromFile(address, DATADIR);
  const privateKey = keythereum.recover(PASSWORD, keyobj).toString('hex');

  return {
    address,
    privateKey,
  };
}

module.exports = initAndStartBlockchain;
