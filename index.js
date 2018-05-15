const http = require('http');
const url = require('url');
const fs = require('fs');
const mime = require('mime');
const socketio = require('socket.io');
const uuid = require('uuid');

function addSpecial (path) {
  var id = uuid.v4();
  specials.push({
    id: id,
    path: path
  });
  return id;
};
function validateSoundJSON (filename) {
  var soundjsonprops = {
    "absolutestart": val => typeof val === "number" && val >= 0,
    "loopstart": val => typeof val === "number",
    "loopend": val => typeof val === "number",
    "volume": val => typeof val === "number" && val >= 0 && val <= 1
  };
  var json = fs.readFileSync(filename, 'utf-8');
  try {
    var json = JSON.parse(json);
    Object.keys(soundjsonprops).forEach(p => {
      if (soundjsonprops[p](json[p]) === false) {
        return false;
      }
    });
    if (json.loopstart > json.loopend) {
      return false; // FIXME: Check for negative values too
    }
  }
  catch (e) {
    return false;
  }
  return true;
};
function listSounds () {
  return fs.readdirSync('./enviroments').map(n => {
    if (fs.statSync('./enviroments/' + n).isDirectory()) {
      let contents = fs.readdirSync('./enviroments/' + n);
      let mp3s = contents.filter(m => {
        if (fs.statSync('./enviroments/' + n + '/' + m).isFile() && mime.getType('./enviroments/' + n + '/' + m).indexOf('audio') > -1) {
          return true;
        }
      });
      let jsons = contents.filter(m => {
        if (fs.statSync('./enviroments/' + n + '/' + m).isFile() && mime.getType('./enviroments/' + n + '/' + m) === "application/json") {
          return true;
        }
      });
      let validsounds = mp3s.filter(function (m) {
        var name = /([a-zA-Z0-9 -]+)\.mp3/.exec(m);
        if (jsons.indexOf(name[1] + ".json") > -1) {
          // check json
          return validateSoundJSON('./enviroments/' + n + '/' + name[1] + '.json');
        }
        else {
          return false;
        }
      }).map(m => /([a-zA-Z0-9 -]+)\.mp3/.exec(m)[1]);
      console.log(n, validsounds);
      return {
        name: n,
        sounds: validsounds
      }
    }
  }).filter(r => r);
};
function listAmbiences () {
  let contents = fs.readdirSync('./ambiences');
  let mp3s = contents.filter(m => {
    if (fs.statSync('./ambiences/' + m).isFile() && mime.getType('./ambiences/' + m).indexOf('audio') > -1) {
      return true;
    }
  });
  let jsons = contents.filter(m => {
    if (fs.statSync('./ambiences/' + m).isFile() && mime.getType('./ambiences/' + m) === "application/json") {
      return true;
    }
  });
  return mp3s.filter(function (m) {
    var name = /([a-zA-Z0-9 -]+)\.mp3/.exec(m);
    if (jsons.indexOf(name[1] + ".json") > -1) {
      // check json
      return validateSoundJSON('./ambiences/' + name[1] + '.json');
    }
    else {
      return false;
    }
  }).map(m => /([a-zA-Z0-9 -]+)\.mp3/.exec(m)[1]);
};
function listCards () {
  return fs.readdirSync('./cards').map(m => {
    if (fs.statSync('./cards/' + m).isFile() && mime.getType('./cards/' + m).indexOf('image') > -1) {
      let p = /([a-zA-Z0-9\-() ]+|\s+)\.(jpg|jpeg|png)/g.exec(m);
      return {
        name: p[1],
        ext: p[2]
      };
    }
  }).filter(r => r);
}

let specials = [];
const server = http.createServer(function (req, res) {
  let URL = url.parse(req.url);
  if (URL.query) {
    let modpath = URL.query.split("&").reduce(function (ass, val) {
      let m = /([a-zA-Z0-9-]+)=([a-zA-Z0-9-]+)/.exec(val);
      ass[m[1]] = m[2];
      return ass;
    }, {}).s;
    if (modpath && specials.find(val => val.id === modpath) !== undefined) {
      var index = specials.find(val => val.id === modpath);
      fs.readFile(index.path, function (err, data) {
        if (err) {
          res.writeHead(500);
          res.end("Server Error");
        }
        else {
          res.writeHead(200, {
            'Content-Length': Buffer.byteLength(data),
            'Content-Type': mime.getType(index.path)
          });
          res.end(data);
        }
      });
    }
  }
  else {
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
  }
});
let io = socketio(server);
io.on('connection', function (socket) {
  let socketspecials = [];
  socket.emit('sounds', listSounds());
  socket.emit('ambiences', listAmbiences());
  socket.emit('cards', listCards());
  socket.on('sound', function (data) {
    let folder = data.split("::::")[0];
    let name = data.split("::::")[1];
    let id = addSpecial('./enviroments/' + folder + '/' + name + '.mp3'); // FIXME: Bottle neck for different types of sound files (change mp3)
    socketspecials.push(id);
    setTimeout(() => {
      socket.emit('sound', {
        folder: folder,
        name: name,
        json: JSON.parse(fs.readFileSync('./enviroments/' + folder + '/' + name + '.json', 'utf-8')),
        sound: id
      });
    }, 100);
  });
  socket.on('ambient', function (data) {
    let name = data;
    let id = addSpecial('./ambiences/' + data + '.mp3');
    socketspecials.push(id);
    setTimeout(() => {
      socket.emit('ambient', {
        name: name,
        json: JSON.parse(fs.readFileSync('./ambiences/' + data + '.json', 'utf-8')),
        sound: id
      });
    }, 100);
  });
  socket.on('card', function (data) {
    let name = data;
    let id = addSpecial('./cards/' + name);
    socketspecials.push(id);
    setTimeout(() => {
      socket.emit('card', id)
    });
  });
  socket.on('disconnected', function () {
    socketspecials.forEach(id => {
      let index = specials.find(val => val.id === id);
      if (index !== undefined) specials.splice(index, 1);
    });
  });
});
server.listen(4000, function (err) {
  if (err) throw err
  else console.log("Server started on http://localhost:4000");
})
