var PORT = 22222;
// change to your network's broadcast address
var ADDRESS = '127.0.0.1';
 
var dgram = require('dgram')
  , ifaces = require('os').networkInterfaces()
  , omitAddresses = []
  , stdin = process.stdin
  , stdout = process.stdout;
 
// stack own address as omits.
Object.keys(ifaces).forEach(function(type){
  ifaces[type].forEach(function(iface){
    console.log(iface);
    if (iface.family.toLowerCase() == 'ipv4' && iface.address != '127.0.0.1') {
      console.log(iface.address);
      omitAddresses.push(iface.address);
    }
  });
});
 
// create socket.
send = dgram.createSocket('udp4');
recv = dgram.createSocket('udp4');
//send.setBroadcast(true);
var data = new Buffer("Hello");
setInterval(function(){
  omitAddresses.forEach(function(a){
    send.send(data, 0, data.length, PORT, a, function(err){});
  });
}, 1000);

recv.on('message', function(data, rinfo){
  console.log("received"+rinfo.address)
  //if (omitAddresses.indexOf(rinfo.address) === -1) {
    stdout.write(data.toString());
  //}
});

recv.bind(PORT);
recv.on('listening', function(){
  console.log(recv.address());
});