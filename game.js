const fps = 30;
const lands = [
  "#ffffff",
  "#80a000",
  "#00a0a0",
  "#a000a0",
  "#90a000",
  "#a00000",
  "#606000",
  "#f0a070",
  "#a00050",
  "#0040a0",
  "#802000",
  "#408020",
  "#000000",
  "#5000a0",
  "#a05000"
];
var json;
{
  let url = new URL(location.href);
  json = (url.searchParams.get('open') ? localStorage.getItem('epidemic_simulator_json'):null)?? `{
    "name": "epidemic_simulator",
    "resolution": 1080,
    "states": [
      { "color": "#00a000", "name": "здоровые", "hiddengraph": true }, 
      { "color": "#a05000", "prob": 0.05, "time": 30000, "initial": 10, "zone": 8, "name": "коклюш" },
      { "color": "#a0a000", "prob": 0.1, "time": 20000, "initial": 3, "zone": 6, "name": "скарлатина" },
      { "color": "#a00000", "prob": 0.5, "time": 1000, "initial": 1, "zone": 8, "name": "COVID-19" },
      { "color": "#0000a0", "prob": 0.03, "time": 10000, "initial": 20, "zone": 10, "name": "грипп" },
      { "color": "#000000", "prob": 0.0001, "time": 2000, "initial": 5, "zone": 420, "name": "чума" },
      { "color": "#a000a0", "prob": 0.05, "time": 15000, "initial": 5, "zone": 8, "speed": 3, "name": "бешенство" },
      { "color": "#00a0a0", "prob": 1, "initial": 1, "zone": 2.5, "protect": 0.9, "transparent": true, "name": "призраки" },
      { "color": "#00a0a0", "prob": 0.03, "initial": 1, "time": 20000, "zone": 10, "protect": 0.6, "heal": 1, "name": "насморк" },
      { "color": "#a00050", "prob": 0.01, "time": 60, "initial": 25, "zone": 10, "after": 10000, "name": "свинка" },
      { "color": "#80a0ff", "prob": 0.03, "initial": 50, "zone": 10, "infect": 1, "protect": 0.999, "name": "доктора" },
      { "color": "#a0a0a0", "initial": 100, "protect": 0.995, "hidden": true, "allone": true, "name": "джекпот" },
      { "color": "#a050a0", "prob": 0.5, "initial": 1, "zone": 10, "parasite": 1000, "name": "паразиты" }
    ], 
    "options": {
      "count": 1000,
      "size": 420,
      "speed": 7,
      "music": true
    },
    "style": {
      "size": 5, 
      "sort": true, 
      "dots": { "color": "ill", "size": 2, "transparent": true },
      "deadanim": true, 
      "chanim": true,
      "anim": true
    }
  }`;
}
var cw, ch, cc, cx, cy, graph, interval;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var graph_ = document.getElementById('graph');
var grp = graph_.getContext('2d');
var arr = [], counts = [], mosq = [], sorted = [];
var lastTime = 0, frame_ = 0;
var obj = JSON.parse(json)
var states = obj.states, options = obj.options, style = obj.style
var landscape = obj.landscape ?? { type: [[0]], pow: [[0]], res: 1 };
var scale = 420/options.size;
let counter = { cells: options.count, rats: options.ratcount };
var started = false, pause = false;
var music = new Audio();
music.src = "https://zvukipro.com/uploads/files/2019-11/1572597916_5d8bce8c181a325.mp3"; //music from zvukipro.com
const fpsTime = 1000/fps/(options.showspeed ?? 1);
function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  let c = w/h;
  const needc = 2;
  let W, H, X, Y;
  if (c == needc) {
    W = w;
    H = h;
    X = 0;
    Y = 0;
  }
  if (c < needc) {
    W = w;
    H = w/needc;
    X = 0;
    Y = (h-(w/needc))/2;
  }
  if (c > needc) {
    W = h*needc;
    H = h;
    X = (w-(h*needc))/2;
    Y = 0;
  }
  let res = style.resolution ?? 1080;
  canvas.width = Math.floor(res);
  canvas.height = Math.floor(res/2);
  canvas.style.width = `${Math.floor(W)}px`;
  canvas.style.height = `${Math.floor(H)}px`;
  cc = res/900;
  canvas.style.top = `${Math.floor(Y)}px`;
  canvas.style.left = `${Math.floor(X)}px`;
  graph_.width = Math.floor(250*cc);
  graph_.height = Math.floor(120*cc);
  cx = Math.floor(X);
  cy = Math.floor(Y);
  cw = W;
  ch = H;
  if (!started) startrender();
}
resize();
addEventListener('resize', resize);
function random(max) {
  return Math.random()*max;
}
function clear() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function X(x) {
  return Math.floor(x*cc);
}
function Y(y) {
  return Math.floor(y*cc);
}
function timeNow() {
  return frame_/30*1000;
}
function flr(num) {
  num = Math.floor(num*10)/10;
  return num%1 == 0 ? num+".0":num;
}
function explosion() {
  for (let i = 0; i < arr.length; i++) {
    let p = arr[i];
    if (p.type == "cell" && p.land.type == 10) {
      p.dead();
    }
  }
}
function startrender() {
  clear();
  ctx.fillStyle = "#a00000a0";
  ctx.font = `${X(42)}px Monospace`;
  ctx.fillText("Кликните чтобы продолжить", X(120), Y(200));
  ctx.fillStyle = "#0000a0a0";
  ctx.font = `${X(36)}px Monospace`;
  ctx.fillText("Симулятор Эпидемий", X(230), Y(100));
}
startrender();
addEventListener('click', () => {
  music.loop = true;
  if (options.music) music.play();
  interval = setInterval(() => { if (performance.now() >= lastTime+fpsTime) frame(); }, 1);
  started = true;
  document.addEventListener('click', click);
}, { once: true });
function fullScreen(e) {
  if(e.requestFullscreen) {
    e.requestFullscreen();
  } else if(e.webkitrequestFullscreen) {
    e.webkitRequestFullscreen();
  } else if(e.mozRequestFullscreen) {
    e.mozRequestFullScreen();
  }
}
function sort() {
  sorted = [];
  for (let i = 0; i < states.length; i++) {
    let st = states[i];
    if (!(st.hidden || st.hiddenstat)) sorted.push(st);
  }
  if (style.sort) {
    for (let j = 0; j < sorted.length-1; j++) {
      let max = sorted[j];
      let maxi = j;
      for (let i = j; i < sorted.length; i++) {
        let c = sorted[i];
        if (c.count.rats+c.count.cells > max.count.rats+max.count.cells) {
          maxi = i;
          max = c;
        }
      }
      sorted[maxi] = sorted[j];
      sorted[j] = max;
    }
  }
}
function ahex(a) {
  a = Math.floor(a);
  return (a < 16 ? "0":"") + a.toString(16);
}
function degToRad(deg) {
  return deg/180*Math.PI;
}
function testCordMinMax(c, size) {
  return Math.min(Math.max(c, size/2), options.size-(size/2));
}
function biggraph() {
  let max = 2;
  let start = style.graphmove ? (frame_ < 290 ? 0:frame_-290):0;
  let timeinc = start*(1000/fps);
  let size = style.graphmove ? (frame_ < 290 ? frame_:290):frame_;
  for (let t = start; t < counts.length; t++) {
    for (let i = 0; i < states.length; i++) {
      if (!(states[i].hidden || states[i].hiddengraph)) {
        let ct = counts[t][i];
        if (ct > max) {
          max = ct;
        }
      }
    }
  }
  ctx.font = `${X(12)}px Monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(X(465), Y(15), X(420), Y(210));
  ctx.fillStyle = "#d0d0d0";
  ctx.fillRect(X(500), Y(40), X(360), Y(2));
  ctx.fillText(`${max}`, X(470), Y(45), X(30));
  ctx.fillRect(X(500), Y(120), X(360), Y(2));
  ctx.fillText(`${Math.floor(max/2)}`, X(470), Y(125), X(30));
  ctx.fillRect(X(500), Y(200), X(360), Y(2));
  ctx.fillText("0", X(470), Y(205), X(30));
  ctx.fillRect(X(530), Y(15), X(2), Y(195));
  ctx.fillText(`${flr(timeinc/1000)}`, X(525), Y(235), X(30));
  ctx.fillRect(X(602.5), Y(15), X(2), Y(195));
  ctx.fillText(`${flr((timeNow()-timeinc)/4000+(timeinc/1000))}`, X(600), Y(235), X(30));
  ctx.fillRect(X(675), Y(15), X(2), Y(195));
  ctx.fillText(`${flr((timeNow()-timeinc)/2000+(timeinc/1000))}`, X(670), Y(235), X(30));
  ctx.fillRect(X(747.5), Y(15), X(2), Y(195));
  ctx.fillText(`${flr((timeNow()-timeinc)/4000*3+(timeinc/1000))}`, X(742.5), Y(235), X(30));
  ctx.fillRect(X(820), Y(15), X(2), Y(195));
  ctx.fillText(`${flr(timeNow()/1000)}`, X(815), Y(235), X(30));
  ctx.lineWidth = X(3);
  if (frame_ > 0) {
    for (let i = 0; i < states.length; i++) {
      if (!(states[i].hidden || states[i].hiddengraph)) {
        ctx.beginPath();
        for (let x = 0; x < 290; x++) {
          let ci = Math.floor(x/290*size)+start;
          let y = 160-(counts[ci][i]/max*160);
          if (x == 0) {
            ctx.moveTo(X(x+530), Y(y+40));
          } else {
            ctx.lineTo(X(x+530), Y(y+40));
          }
        }
        ctx.strokeStyle = states[i].color + (states[i].transparent ? "80":"ff");
        ctx.stroke();
      }
    }
  }
}
function updateGraph() {
  let max = 2;
  let start = style.graphmove ? (frame_ < 160 ? 0:frame_-160):0;
  let timeinc = start*(1000/fps);
  let size = style.graphmove ? (frame_ < 160 ? frame_:160):frame_;
  for (let t = start; t < counts.length; t++) {
    for (let i = 0; i < states.length; i++) {
      if (!(states[i].hidden || states[i].hiddengraph)) {
        let ct = counts[t][i];
        if (ct > max) {
          max = ct;
        }
      }
    }
  }
  grp.font = `${X(9)}px Monospace`;
  grp.fillStyle = "#ffffff";
  grp.fillRect(0, 0, graph_.width, graph_.height);
  grp.fillStyle = "#d0d0d0";
  grp.fillRect(X(35), Y(10), X(165), Y(1));
  grp.fillText(`${max}`, X(10), Y(15), X(20));
  grp.fillRect(X(35), Y(50), X(165), Y(1));
  grp.fillText(`${Math.floor(max/2)}`, X(10), Y(55), X(20));
  grp.fillRect(X(35), Y(90), X(165), Y(1));
  grp.fillText("0", X(10), Y(95), X(20));
  grp.fillRect(X(40), Y(5), X(1), Y(90));
  grp.fillText(`${flr(timeinc/1000)}`, X(40), Y(105), X(30));
  grp.fillRect(X(75), Y(5), X(1), Y(90));
  grp.fillText(`${flr((timeNow()-timeinc)/4000/20*18+(timeinc/1000))}`, X(70), Y(105), X(30));
  grp.fillRect(X(110), Y(5), X(1), Y(90));
  grp.fillText(`${flr((timeNow()-timeinc)/2000/20*18+(timeinc/1000))}`, X(110), Y(105), X(30));
  grp.fillRect(X(145), Y(5), X(1), Y(90));
  grp.fillText(`${flr((timeNow()-timeinc)/4000*3/20*18+(timeinc/1000))}`, X(145), Y(105), X(30));
  grp.fillRect(X(180), Y(5), X(1), Y(90));
  grp.fillText(`${flr((timeNow()-timeinc)/1000/20*18+(timeinc/1000))}`, X(180), Y(105), X(30));
  grp.lineWidth = X(2);
  if (frame_ > 0) {
    for (let i = 0; i < states.length; i++) {
      if (!(states[i].hidden || states[i].hiddengraph)) {
        grp.beginPath();
        for (let x = 0; x < 160; x++) {
          let ci = Math.floor(x/160*size)+start;
          let y = 90-(counts[ci][i]/max*80);
          if (x == 0) {
            grp.moveTo(X(x+40), Y(y));
          } else {
            grp.lineTo(X(x+40), Y(y));
          }
        }
        grp.strokeStyle = states[i].color + (states[i].transparent ? "80":"ff");
        grp.stroke();
      }
    }
  }
  graph = grp.getImageData(0, 0, graph_.width, graph_.height);
}
