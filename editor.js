const lands = [
  { color: "#ffffff", bcolor: "#d0d0d0", name: "без ландшафта" },
  { color: "#80a000", bcolor: "#709000", name: "отравленная зона" },
  { color: "#00a0a0", bcolor: "#009090", name: "санитарная зона" },
  { color: "#a000a0", bcolor: "#900090", name: "зона биологической опасности" },
  { color: "#a09000", bcolor: "#908000", name: "пляжная зона" },
  { color: "#a00000", bcolor: "#900000", name: "зона повышенного заражёния" }
];
const props = [
  { title: "Коэффициент скорости:", type: "num", id: "speed", check: [0, 3, false], default: 1, form: "${num}", aform: "${num}" },
  { title: "Вероятность излечения(%):", type: "num", id: "heal", check: [0, 100, false], default: 0, form: "${num}/100", aform: "${num}*100" },
  { title: "Трансформация в:", type: "num", id: "transform", check: [0, 'states.length', true], default: 1, form: "${num}-1", aform: "${num}+1" },
  { title: "Заражение в (0 = себя):", type: "num", id: "infect", check: [0, 'states.length', true], default: 0, form: "${num}", aform: "${num}" },
  { title: "Паразит (0 = без паразита):", type: "num", id: "parasite", check: [0, 120, false], default: 0, form: "${num}*1000", aform: "${num}/1000" },
  { title: "Инфекция после смерти(с):", type: "num", id: "after", check: [0, 120, false], default: 0, form: "${num}*1000", aform: "${num}/1000" },
  { title: "Переатака(%):", type: "num", id: "attacktrans", check: [0, 100, false], default: 0, form: "${num}/100", aform: "${num}*100" },
  { title: "Отдых(с):", type: "num", id: "rest", check: [0, 120, false], default: 0, form: "${num}*1000", aform: "${num}/1000" },
  { title: "Телепорт(пкс.):", type: "num", id: "teleporto", check: [0, 420, false], default: 0, form: "${num}", aform: "${num}" },
  { title: "Москиты(шт.):", type: "num", id: "mosquito", check: [0, 3, true], default: 0, form: "${num}", aform: "${num}" },
  { title: "Убийца(%):", type: "num", id: "killer", check: [0, 100, false], default: 0, form: "${num}/100", aform: "${num}*100" },
  { title: "Зона магнита(пкс.):", type: "num", id: "magnet", check: [0, 420, false], default: 0, form: "${num}", aform: "${num}" },
  { title: "Сила магнита:", type: "num", id: "magnetpow", check: [0, 12, false], default: 0, form: "${num}", aform: "${num}" },
  { title: "Добавка время(с):", type: "num", id: "addtime", check: [0, 120, false], default: 0, form: "${num}*1000", aform: "${num}/1000" },
  { title: "Добавка количество(шт.):", type: "num", id: "addcount", check: [0, 20, false], default: 0, form: "${num}", aform: "${num}" },
  { title: "Количество добавок (0 = бесконечно):", type: "num", id: "countadd", check: [0, 50, true], default: 0, form: "${num}", aform: "${num}" },
  { title: "Шипы(%):", type: "num", id: "spikes", check: [0, 100, false], default: 0, form: "${num}/100", aform: "${num}*100" },
  { title: "Анти-ландшафт(%):", type: "num", id: "antiland", check: [0, 100, false], default: 0, form: "${num}/100", aform: "${num}*100" },
  { title: "Грабитель", type: "chk", id: "robber", default: false },
  { title: "Всё за одного", type: "chk", id: "allone", default: false },
  { title: "Невидимка", type: "chk", id: "invisible", default: false }
];
var lastnum = 0;
var states = [];
var options = {
  size: 420,
  count: 1000,
  speed: 7,
  quar: 0,
  stop: false,
  music: true,
  turbo: false,
  resolution: 1080,
  onlygame: false,
  mosquitospeed: 7,
  mosquitoprob: 0.5,
  mosquitotime: 3000,
  mosquitozone: 1,
  healzone: 30,
  showspeed: 1,
  biggraph: false,
  graphmove: false
};
var openedadd = [];
var openedaddopt = false;
var landscape = { type: [], pow: [], res: 7 };
var $ = (id) => document.getElementById(id);
var lan = $('landscape').getContext('2d');
var name = "без имени";
var landsel;
{
  for (let i = lands.length-1; i >= 0; i--) {
    let p = lands[i];
    $('landscapes').innerHTML = `<button class="landscape" style="background-color: ${p.color}; border: 2px solid ${p.bcolor};" onclick="setLand(${i});"></button>` + $('landscapes').innerHTML;
  }
  for (let i = 0; i < landscape.res; i++) {
    landscape.type[i] = new Array(landscape.res).fill(0);
    landscape.pow[i] = new Array(landscape.res).fill(0);
  }
  setLand(0);
  lan.fillStyle = "#d0d0d0";
  lan.fillRect(0, 0, 450, 15);
  lan.fillRect(0, 435, 450, 15);
  lan.fillRect(0, 0, 15, 450);
  lan.fillRect(435, 0, 15, 450);
}
$('landscape').addEventListener('click', (e) => {
  let r = e.target.getBoundingClientRect();
  let x = (e.clientX-r.left)/160*450-15;
  let y = (e.clientY-r.top)/160*450-15;
  let px = options.size/landscape.res;
  if (x > 0 && y > 0 && x < 420 && y < 420) {
    x = Math.floor(x/px);
    y = Math.floor(y/px);
    landscape.type[x][y] = landsel;
    landscape.pow[x][y] = Number($('landpow').value)/100;
    landrender();
  }
});
function landResCh() {
  if (confirm("При изменении разрешения ландшафт будет сброшен. Изменить? ")) {
    landscape.res = $('landres').value;
    landscape.type = [];
    landscape.pow = [];
    for (let i = 0; i < landscape.res; i++) {
      landscape.type[i] = new Array();
      for (let j = 0; j < landscape.res; j++) landscape.type[i].push(0);
      landscape.pow[i] = new Array();
      for (let j = 0; j < landscape.res; j++) landscape.pow[i].push(0);
    }
    landrender();
  } else {
    $('landres').value = landscape.res;
  }
}
function setLand(i) {
  landsel = i;
  let p = lands[i];
  $('landsel').innerHTML = p.name;
  $('landsel').style.color = p.bcolor;
}
function landrender() {
  lan.fillStyle = "#ffffff";
  lan.fillRect(0, 0, 450, 450);
  lan.fillStyle = "#d0d0d0";
  lan.fillRect(0, 0, 450, 15);
  lan.fillRect(0, 435, 450, 15);
  lan.fillRect(0, 0, 15, 450);
  lan.fillRect(435, 0, 15, 450); 
  let px = 420/landscape.res;
  for (let x = 0; x < landscape.res; x++) {
    for (let y = 0; y < landscape.res; y++) {
      lan.fillStyle = lands[landscape.type[x][y]].color + ahex(landscape.pow[x][y]*120);
      lan.fillRect(x*px+15, y*px+15, px, px);
    }
  }
}
function downloadgame() {
  let blob = new Blob([createJSON()], { type: "application/json" });
  let lnk = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = lnk;
  a.download = `${name}.json`;
  a.click();
}
function playgame() {
  localStorage.setItem('epidemic_simulator_json', createJSON());
  open('game.html?open=true');
}
function createJSON() {
  let opts = Object.assign({}, options);
  delete opts.resolution;
  delete opts.turbo;
  delete opts.biggraph;
  delete opts.movegraph;
  let obj = {
    name: name,
    states: [], 
    options: opts,
    landscape: landscape,
    style: {
      size: 5,
      sort: true,
      dots: options.turbo ? false:{ color: "ill", size: 2, transparent: true },
      deadanim: !options.turbo,
      chanim: !options.turbo,
      anim: !options.turbo,
      onlygame: options.turbo,
      resolution: options.resolution,
      mosquitosize: 2,
      biggraph: options.biggraph,
      graphmove: options.graphmove
    }
  };
  for (let i = 0; i < states.length; i++) {
    let o = Object.assign({}, states[i]);
    delete o.div;
    delete o.points;
    delete o.num;
    obj.states.push(o);
  }
  return JSON.stringify(obj);
}
function newState(name, color) {
  let num = lastnum;
  let div = document.createElement('div');
  let add = "";
  for (let i = 0; i < props.length; i++) {
    let p = props[i];
    if (p.type == "num") add += `<div><label for="${p.id+num}" class="label">${p.title}</label>
    <input type="number" id="${p.id+num}" onchange="updateStates();" value="${p.default}" ${p.deflaut ? "checked":""}></div>`;
    if (p.type == "chk") add += `<div><input type="checkbox" id="${p.id+num}" onchange="updateStates();">
    <label for="${p.id+num}" class="label">${p.title}</label></div>`;
  }  
  div.innerHTML = `
    <div class="namediv">
      <b id="num${num}" class="label" style="color: ${color};">${states.length+1}</b>
      <input type="text" class="name" id="name${num}" value="${name}" onchange="updateStates();" maxlength="30">${num == 0 ? "":`<button style="background-color: #00000000; border: none; display: inline;" onclick="deletestate(${num});"><img src="assets/delete.svg" height="12"></button>
    <button style="background-color: #00000000; border: none; display: inline;" onclick="copystate(${num});"><img src="assets/copy.svg" height="12"></button>`}
      <input type="checkbox" id="hiddenstat${num}" onchange="updateStates();" style="display: inline;" checked>
      <input type="checkbox" id="hiddengraph${num}" onchange="updateStates();" style="display: inline;" ${num == 0 ? "":"checked"}>
      <b id="points${num}" class="label" style="color: ${color};">0</b>
    </div>
    <input type="color" id="color${num}" class="colorsel" value="${color}">
    <button class="color" id="colorred" onclick="$('color${num}').value='#a00000'; updateStates();"></button>
    <button class="color" id="colorora" onclick="$('color${num}').value='#a05000'; updateStates();"></button>
    <button class="color" id="coloryel" onclick="$('color${num}').value='#a0a000'; updateStates();"></button>
    <button class="color" id="colorgre" onclick="$('color${num}').value='#00a000'; updateStates();"></button>
    <button class="color" id="coloraqu" onclick="$('color${num}').value='#00a0a0'; updateStates();"></button>
    <button class="color" id="colorblu" onclick="$('color${num}').value='#0000a0'; updateStates();"></button>
    <button class="color" id="colormag" onclick="$('color${num}').value='#a000a0'; updateStates();"></button>
    <button class="color" id="colorpur" onclick="$('color${num}').value='#a00050'; updateStates();"></button>
    <button class="color" id="colorbla" onclick="$('color${num}').value='#000000'; updateStates();"></button>
    <div><input type="checkbox" id="transparent${num}" onchange="updateStates()">
    <label for="transparent${num}" class="label">Полупрозрачность</label></div>
    <div><label for="prob${num}" class="label">Вероятность(%):</label>
    <input type="number" id="prob${num}" onchange="updateStates();" value="0"></div>
    <div><label for="zone${num}" class="label">Зона(пкс.):</label>
    <input type="number" id="zone${num}" onchange="updateStates();" value="0"></div>
    ${num == 0 ? "":`<div><label for="initial${num}" class="label">Начальная попуяция(шт.):</label>
    <input type="number" id="initial${num}" onchange="if (this.value != 1) $('pos${num}').checked = false; updateStates();" value="0"></div>`}
    <div><label for="time${num}" class="label">Длина жизни(с) 0 = бесконечно:</label>
    <input type="number" id="time${num}" onchange="updateStates();" value="0"></div>
    <div><label for="protect${num}" class="label">Защита(%):</label>
    <input type="number" id="protect${num}" onchange="updateStates();" value="0"></div>
    <p style="font-family: Monospcace, sans-serif; font-size: 15px;" onclick="addh(${num});">Дополнительно <img src="assets/down.svg" id="add_${num}" width="12"></p>
    <div id="add${num}" style="display: none;">
      ${add}
      ${num == 0 ? "":`<div><input type="checkbox" id="pos${num}" onchange="updateStates();">
      <label for="pos${num}" class="label">Точная позиция</label></div>
      <div><label for="x${num}" class="label">Точная позиция(X):</label>
      <input type="number" id="x${num}" onchange="checknum(this, -100, 100, false); updateStates();" value="0"></div>
      <div><label for="y${num}" class="label">Точная позиция(Y):</label>
      <input type="number" id="y${num}" onchange="checknum(this, -100, 100, false); updateStates();" value="0"></div>`}
    </div>
    <div class="border"></div>
  `;
  let obj = {
    color: color,
    transparent: false,
    hiddenstat: false,
    hiddengraph: num == 0 ? true:false,
    name: name,
    initial: 0,
    prob: 0,
    zone: 0,
    time: 0,
    protect: 0,
    num: num,
    div: div
  };
  for (let i = 0; i < props.length; i++) {
    let p = props[i];
    obj[p.id] = p.default;
  }
  $('states').appendChild(div);
  $(`color${num}`).addEventListener("change", updateStates)
  states.push(obj);
  openedadd.push(false);
  lastnum++;
  updateStates();
  return obj;
}
function updateState(n) {
  let i = states[n].num;
  checknum($(`protect${i}`), 0, 100, false);
  checknum($(`time${i}`), 0, 120, false);
  if (n != 0) checknum($(`initial${i}`), 0, options.count-checksum(n), true);
  checknum($(`zone${i}`), 0, 420, false);
  checknum($(`prob${i}`), 0, 100, false);
  if (n != 0) if ($(`initial${i}`).value !== '1') $(`pos${i}`).checked = false;
  let obj = {
    color: $(`color${i}`).value,
    transparent: $(`transparent${i}`).checked,
    hiddenstat: !$(`hiddenstat${i}`).checked,
    hiddengraph: !$(`hiddengraph${i}`).checked,
    name: $(`name${i}`).value,
    div: states[n].div,
    num: i,
    points: 0,
    prob: Number($(`prob${i}`).value)/100,
    zone: Number($(`zone${i}`).value),
    initial: n == 0 ? null:Number($(`initial${i}`).value),
    time: Number($(`time${i}`).value)*1000,
    protect: Number($(`protect${i}`).value)/100
  };
  for (let j = 0; j < props.length; j++) {
    let p = props[j];
    if (p.type == "num") checknum($(`${p.id+i}`), eval(p.check[0]), eval(p.check[1]), eval(p.check[2]));
    let num = Number($(`${p.id+i}`).value);
    if (p.type == "num") obj[p.id] = eval(`eval(\`${p.form}\`);`);
    if (p.type == "chk") obj[p.id] = $(`${p.id+i}`).checked;
  }
  if (n != 0) obj.position = $(`pos${i}`).checked ? [ { x: (Number($(`x${i}`).value)+100)*2.075+2.5, y: (Number($(`y${i}`).value)+100)*2.075+2.5 } ]:null;
  else obj.position = null;
  obj.points += ((obj.zone**2*obj.prob)+(obj.attacktrans/4)+obj.protect)*((obj.time ? obj.time/1000:(obj.parasite ? 1:240))+(obj.after/500)-(obj.rest/500))/(obj.parasite ? 120/obj.parasite:1)/(obj.allone ? 1000:1)/(obj.infect ? 100:1)*(obj.initial || (obj.addcount && obj.addtime)|| i == 0 ? 1:0);
  obj.points += obj.protect/100;
  if (obj.robber && options.quar) obj.points += options.size/options.size;
  obj.points += obj.initial+(obj.mosquito*options.mosquitotime*(options.mosquitozone**2)*options.mosquitoprob/1000);
  if (obj.addtime) obj.points += obj.addcount/obj.addtime*48000;
  obj.points = Math.floor(obj.points);
  $(`points${i}`).innerHTML = obj.points;
  $(`points${i}`).style.color = obj.color;
  $(`num${i}`).style.color = obj.color;
  $(`num${i}`).innerHTML = n+1;
  states[n] = obj;
}
function updateStates() {
  for (let i = 0; i < states.length; i++) {
    updateState(i);
  }
}
function checknum(obj, min, max, trunc) {
  let num = obj.value;
  num = num == "" ? 0:num;
  if (num < min) num = min;
  if (num > max) num = max;
  if (trunc) num = Math.trunc(num);
  obj.value = num;
}
function deletestate(i) {
  for (let j = 0; j < states.length; j++) {
    if (states[j].num == i) i = j;
  }
  if (confirm(`Вы хотите удалить состояние '${states[i].name}'?`)) {
    states[i].div.remove();
    states.splice(i, 1);
    openedadd.splice(i, 1);
    updateStates();
  }
}
function checksum(i) {
  let out = 0;
  for (let j = 1; j < states.length; j++) {
    if (j != i) out += states[j].initial;
  }
  return out;
}
function copystate(i) {
  for (let j = 0; j < states.length; j++) {
    if (states[j].num == i) i = j;
  }
  let cs = states[i];
  let num = states.length;
  let ns = newState(cs.name + " копия", cs.color);
  i = ns.num;
  $(`hiddenstat${i}`).checked = !(cs.hiddenstat ?? false);
  $(`hiddengraph${i}`).checked = !(cs.hiddengraph ?? false);
  $(`transparent${i}`).checked = cs.transparent ?? false;
  $(`prob${i}`).value = (cs.prob ?? 0)*100;
  $(`zone${i}`).value = cs.zone ?? 0;
  $(`initial${i}`).value = cs.initial ?? 0;
  $(`protect${i}`).value = (cs.protect ?? 0)*100;
  $(`time${i}`).value = (cs.time ?? 0)/1000;
  for (let j = 0; j < props.length; j++) {
    let p = props[j];
    let num = cs[p.id];
    if (p.type == "num") $(`${p.id+i}`).value = num ? eval(`eval(\`${p.aform}\`);`):p.default;
    if (p.type == "chk") $(`${p.id+i}`).checked = p.invert ? !cs[p.id]:cs[p.id];
  }
  if (cs.position) {
    $(`pos${i}`).checked = true;
    $(`x${i}`).value = Math.floor(((cs.position[0].x ?? 210)-2.5)/2.075)-100;
    $(`y${i}`).value = Math.floor(((cs.position[0].y ?? 210)-2.5)/2.075)-100;
  }
  updateStates();
}
function opengame(file) {
  let reader = new FileReader();
  let log = (txt) => $('console').value += txt+"\n";
  $('console').value = "";
  reader.readAsText(file);
  reader.onload = function() {
    readgame(reader.result);
  };
  reader.onerror = function() {
    log("Ошибка при чтении файла: " + reader.error);
  };
}
function readgame(json) {
  let log = (txt) => $('console').value += txt+"\n";
  log("Файл обрабатывается...")
  let obj = JSON.parse(json);
  if (typeof obj == "object") {
    log("JSON прочитан, идёт проверка объекта...")
    if (obj.states && obj.options && obj.style && obj.name && obj.landscape) {
      log("Проверка states...");
      if (states[0] && states.length) {
        log("Проверка options...");
        if (obj.options.count && obj.options.speed) {
          log("Проверка style...");
          if (obj.style.size) {
            log("Проверка landscape...")
            if (obj.landscape.type && obj.landscape.pow && obj.landscape.res) {
              log("Загрузка...");
              $('states').innerHTML = "";
              states = [];
              openedadd = [];
              lastnum = 0;
              for (let i = 0; i < obj.states.length; i++) {
                let st = obj.states[i];
                if (st.name && st.color) {
                  newState(st.name, st.color);
                  $(`hiddenstat${i}`).checked = !(st.hiddenstat ?? false);
                  $(`hiddengraph${i}`).checked = !(st.hiddengraph ?? false);
                  $(`transparent${i}`).checked = st.transparent ?? false;
                  $(`prob${i}`).value = (st.prob ?? 0)*100;
                  $(`zone${i}`).value = st.zone ?? 0;
                  if (i != 0) $(`initial${i}`).value = st.initial ?? 0;
                  $(`protect${i}`).value = (st.protect ?? 0)*100;
                  $(`time${i}`).value = (st.time ?? 0)/1000;
                  for (let j = 0; j < props.length; j++) {
                    let p = props[j];
                    let num = st[p.id];
                    if (p.type == "num") $(`${p.id+i}`).value = eval(`eval(\`${p.aform}\`);`);
                    if (p.type == "chk") $(`${p.id+i}`).checked = p.invert ? !st[p.id]:st[p.id];
                  }
                  if (i != 0 && st.position) {
                    $(`pos${i}`).checked = true;
                    $(`x${i}`).value = Math.floor(((st.position[0].x ?? 210)-2.5)/2.075)-100;
                    $(`y${i}`).value = Math.floor(((st.position[0].y ?? 210)-2.5)/2.075)-100;
                  }
                  updateState(i);
                } else {
                  log(`Ошибка при загрузке: состояние ${i} не содержит обязательные поля`);
                  setTimeout(() => close(), 500);
                }
              }
              name = obj.name;
              $('name').value = name;
              options = {
                size: 420,
                count: obj.options.count,
                speed: obj.options.speed,
                quar: obj.options.quar ?? 0,
                stop: false,
                music: options.music,
                turbo: options.turbo,
                resolution: options.resolution,
                mosquitospeed: obj.options.mosquitospeed ?? 7,
                mosquitotime: obj.options.mosquitotime ?? 3000,
                mosquitoprob: obj.options.mosquitoprob ?? 0.5,
                mosquitozone: obj.options.mosquitozone ?? 1,
                healzone: obj.options.healzone ?? 30,
                showspeed: options.showspeed,
                biggraph: options.biggraph,
                graphmove: options.graphmove
              };
              $('count').value = options.count;
              $('speed').value = options.speed;
              $('quar').value = options.quar;
              $('mosquitospeed').value = options.mosquitospeed;
              $('mosquitotime').value = options.mosquitotime/1000;
              $('mosquitoprob').value = options.mosquitoprob*100;
              $('mosquitozone').value = options.mosquitozone;
              $('healzone').value = options.healzone;
              $('music').checked = options.music;
              $('biggraph').checked = options.biggraph;
              $('turbo').checked = options.turbo;
              $('graphmove').checked = options.graphmove;
              $('speedshow').innerHTML = options.showspeed == 1000 ? "Макс.": `x${options.showspeed} `;
              $('resshow').innerHTML = options.resolution + "р ";
              landscape = {
                type: obj.landscape.type,
                pow: obj.landscape.pow,
                res: obj.landscape.res
              };
              $('landres').value = landscape.res;
              landrender();
              log("Загрузка завершена");
              updateStates();
              setTimeout(() => { $('opengame').style.display='none'; $('editor').style.display='block'; }, 500);
            } else {
              log("Ошибка: landscape не содержит обязательные поля");
            }
          } else {
            log("Ошибка: style не содержит обязательные поля");
          }
        } else {
          log("Ошибка: options не содержит обязательные поля");
        }
      } else {
        log("Ошибка: неверный states");
      }
    } else {
      log("Ошибка: объект не содержит обязательные поля");
    }
  }
}
function addh(i) {
  if (openedadd[i]) {
    $(`add_${i}`).src = 'assets/down.svg';
    $(`add${i}`).style.display = 'none';
    openedadd[i] = false;
  } else {
    $(`add_${i}`).src = 'assets/up.svg';
    $(`add${i}`).style.display = 'block';
    openedadd[i] = true;
  }
}
function addopt() {
  if (openedaddopt) {
    $(`addopt_`).src = 'assets/down.svg';
    $(`addopt`).style.display = 'none';
    openedaddopt = false;
  } else {
    $(`addopt_`).src = 'assets/up.svg';
    $(`addopt`).style.display = 'block';
    openedaddopt = true;
  }
}
function testCount() {
  if (options.count <= 2000) $('countwarn').innerHTML = "";
  if (options.count > 2000) $('countwarn').innerHTML = " Не запускайте на слабых устройствах!";
}
function ahex(a) {
  a = Math.floor(a);
  return (a < 16 ? "0":"") + a.toString(16);
}
newState("здоровые", "#00a000");
