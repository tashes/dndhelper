const http = require('http');
const url = require('url');
const fs = require('fs');
const mime = require('mime');
const socketio = require('socket.io');

const server = http.createServer(function (req, res) {
  let URL = url.parse(req.url);
  if (URL.path[URL.path.length - 1] === "/")  URL.path += "index.html";
  fs.readFile("./webface" + URL.path, function (err, data) {
    if (err) {
      res.writeHead(500);
      res.end("Server Error");
    }
    else {
      res.writeHead(200, {
        'Content-Length': Buffer.byteLength(data),
        'Content-Type': mime.getType("./webface" + URL.path)
      });
      res.end(data);
    }
  });
});
let io = socketio(server);
io.on('connection', function (socket) {

});
server.listen(4000, function (err) {
  if (err) throw err
  else console.log("Server started on http://localhost:4000");
})
