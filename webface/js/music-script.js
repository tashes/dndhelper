var socket = io();

// Enviroment
(function () {
  let envdata = [];

  function setEnviromentData (data) {
    envdata = data;
    let txt = "";
    data.forEach(n => {
      txt += `<div class="item" data-name="${n.name}">${n.name}</div>`;
    });
    document.querySelector('#enviromentSelection_list').innerHTML = txt;
    document.querySelectorAll('#enviromentSelection_list > .item').forEach(p => {
       p.addEventListener('click', function () {
         setEnviromentSounds(this.getAttribute('data-name'));
       });
     });
  };
  setEnviromentSounds = function (enviromentname) {
    envdata.forEach(n => {
      if (n.name === enviromentname) {
        document.querySelector('#enviromentSelection_title').innerHTML = enviromentname;
        let txt = "";
        n.sounds.forEach(m => {
          txt += `<div class="item" data-sound="${enviromentname}::::${m}">${m}</div>`;
        });
        if (n.sounds.length === 0) {
          txt = `<div class="nosounds">No Enviroment Sounds Found</div>`;
        }
        document.querySelector('#enviromentSounds').innerHTML = txt;
        document.querySelectorAll('#enviromentSounds > .item').forEach(p => {
          p.addEventListener('click', function () {
            Player.playSound(this.getAttribute('data-sound'));
          });
        });
      }
    });
  };

  document.querySelector('#enviromentSelection').addEventListener('click', function () {
    this.classList.toggle('_active');
  });

  socket.on('sounds', function (data) {
    setEnviromentData(data);
    if (data.length > 0) {
      setEnviromentSounds(data[0].name);
    }
  });
})();

// Ambiences
(function () {
  socket.on('ambiences', function (data) {
    let txt = "";
    data.forEach(p => {
      txt += `<div class="item" data-sound="${p}">${p}</div>`;
    });
    if (data.length === 0) txt += `<div class="nosounds">No Ambiences Available</div>`;
    document.querySelector('#ambience').innerHTML = txt;
    document.querySelectorAll('#ambience > .item').forEach(function (ele) {
      ele.addEventListener('click', function () {
        console.log(this.getAttribute('data-sound'));
        Player.playAmbient(this.getAttribute('data-sound'));
      });
    });
  });
})();

// Player
(function () {
  Player = {};

  let audio = new Audio;
  let audioendtime = 0;
  let audiostarttime = 0;
  let absolutestarttime = 0;

  function resetAudio () {
    if (audiostarttime >= 0) {
      audio.currentTime = audiostarttime;
    }
    else {
      audio.currentTime = (audio.duration + audiostarttime);
    }
  };

  Player.playSound = function (value) {
    socket.emit('sound', value);
  };
  Player.playAmbient = function (value) {
    socket.emit('ambient', value);
  };

  window.Player = Player;

  document.querySelector('#player_button').addEventListener('click', function () {
    if (audio.readyState === 4) {
      if (audio.paused) {
        audio.play();
        document.querySelector('#player').classList.add('_playing');
      }
      else {
        audio.pause();
        document.querySelector('#player').classList.remove('_playing');
      }
    }
  });
  audio.addEventListener('canplay', function () {
    this.currentTime = absolutestarttime;
    this.play();
  });
  audio.addEventListener('timeupdate', function (e) {
    var ms = this.currentTime * 1000;
    document.querySelector('#player_time').innerHTML = moment.duration(ms).format('hh:mm:ss');
    // check if reached end
    if (audioendtime > 0) {
      if (this.currentTime >= audioendtime) {
        resetAudio();
      }
    }
  });
  audio.addEventListener('ended', function () {
    resetAudio();
    audio.play();
  });
  socket.on('sound', function (data) {
    audio.src = location.href + '?s=' + data.sound;
    document.querySelector('#player_current').innerHTML = data.name + " - " + data.folder;
    document.querySelector('#player').classList.add('_playing');
    absolutestarttime = data.json.absolutestart / 1000;
    audiostarttime = data.json.loopstart / 1000;
    audioendtime = data.json.loopend / 1000;
    audio.volume = data.json.volume;
  });
  socket.on('ambient', function (data) {
    audio.src = location.href + '?s=' + data.sound;
    document.querySelector('#player_current').innerHTML = data.name;
    document.querySelector('#player').classList.add('_playing');
    absolutestarttime = data.json.absolutestart / 1000;
    audiostarttime = data.json.loopstart / 1000;
    audioendtime = data.json.loopend / 1000;
    audio.volume = data.json.volume;
  });
})();
