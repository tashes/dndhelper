var socket = io();

(function () {
  function requestCard (id) {
    socket.emit('card', id);
  };

  socket.on('cards', function (data) {
    let txt = ``;
    data.forEach(m => {
      txt += `<div class="item" data-id="${m.name}.${m.ext}">${m.name}</div>\n`;
    });
    if (data.length === 0) {
      txt = `<div class="nosounds">No Cards Available</div>`;
      document.querySelector('#list').innerHTML = txt;
    }
    else {
      txt = txt.split('\n');
      txt.splice(1, 0, `<div class="divider"></div>`);
      txt = txt.join('');
      document.querySelector('#list').innerHTML = txt;
      document.querySelectorAll('#list .item').forEach(e => e.addEventListener('click', function () {
        let id = this.getAttribute('data-id');
        requestCard(id);
        // COMBAK 1
      }));
      const sortable = new Draggable.Sortable(document.querySelector('#list'), {
        draggable: '.item',
        appendTo: '#list',
        mirror: {
          constrainDimensions: true,
        },
      });
    }
  });
  socket.on('card', function (data) {
    document.querySelector('#card').src = location.href + '?s=' + data;
  });
})();
