geth --genesis genesis.json --datadir node --networkid 1900 --nodiscover --maxpeers 0 console

geth --datadir node1 account new
geth --datadir node1 init genesis.json
geth --datadir node2 init genesis.json
geth --identity node1 --http --http.port "8000" --http.corsdomain "*" --datadir node1 --port "30303" --nodiscover --http.api "db,eth,net,web3,personal,miner,admin" --networkid 1900 --nat "any" --allow-insecure-unlock console
geth --identity node2 --http --http.port "8001" --http.corsdomain "*" --datadir node2 --port "30304" --nodiscover --http.api "db,eth,net,web3,personal,miner,admin" --networkid 1900 --nat "any" --allow-insecure-unlock console

admin.addPeer("enode://b20fe9866aa54bc3c44f3bbb575f3f253b6cf395b2285c71528e9dc422765a51f3c863e117ddc817f2922e1535a46c7e2c05e45527ea3bc16ad06a2e14d2b580@[::]:30304?discport=0")
admin.addPeer("enode://f8adf8b239a821e0d434c6eb9c79f636ba5a995d1f3b30bb964daa868d5ead9e38537cd9610f6833a39bd905660410a3b2fa90297bbdb49235a680fc0a8dd97b@[::]:30303?discport=0")