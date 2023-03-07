class Cell {
  constructor(id, x, y, state) {
    this.x = testCordMinMax(x ?? random(options.size), style.size);
    this.y = testCordMinMax(y ?? random(options.size), style.size);
    this.speed = { x: random(options.speed)-(options.speed/2), y: random(options.speed)-(options.speed/2) };
    this.state = 0;
    this.id = id;
    this.alive = true;
    this.time = timeNow();
    this.st = states[0];
    this.infectable = false;
    this.frame = this.state ? 0:false;
    this.teleportated = false;
    this.magnet = null;
    this.infect = this.st.infect ?? this.state;
    this.infectable = this.st.zone && this.st.prob;
    this.parasitetime = false;
    this.type = "cell";
    counter.cells++;
    this.st.count.cells++;
    if (state) this.toState(state);
    {
      let px = options.size/landscape.res;
      this.land = { x: Math.floor(this.x/px), y: Math.floor(this.y/px) };
      this.land.type = this.st.antiland > Math.random() ? 0:landscape.type[this.land.x][this.land.y];
      this.land.pow = landscape.pow[this.land.x][this.land.y];
    }
    {
      let shome = { minx: style.size/2, miny: style.size/2, maxx: options.size-(style.size/2), maxy: options.size-(style.size/2) };
      if (options.quar) {
        this.home = { minx: Math.max(style.size/2, this.x-options.quar), miny: Math.max(style.size/2, this.y-options.quar), maxx: Math.min(options.size-(style.size/2), this.x+options.quar), maxy: Math.min(options.size-(style.size/2), this.y+options.quar) };
      } else {
        this.home = shome;
      }
    }
  }
  toState(state, init) {
    if (this.alive) {
      let laststate = this.st;
      this.st.count.cells--;
      if (this.st.allone) {
        this.st.allone = false;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].id != this.id && arr[i].state == this.state) arr[i].toState(state);
        }
        this.st.allone = true;
      }
      this.state = state;
      this.time = timeNow();
      this.frame = frame_;
      this.st = states[state];
      this.infect = this.st.infect ? this.st.infect-1:this.state;
      this.st.count.cells++;
      if (this.st.teleporto && !init) {
        this.teleportated = { st: laststate, x: this.x, y: this.y }
        this.x = Math.max(Math.min(this.x+random(this.st.teleporto*2+1)-this.st.teleporto, options.size), 0);
        this.y = Math.max(Math.min(this.y+random(this.st.teleporto*2+1)-this.st.teleporto, options.size), 0);
      } else {
        this.teleportated = false;
      }
      if (this.st.prob && this.st.zone) {
        if (this.st.rest) {
          this.restend = timeNow()+this.st.rest;
          this.infectable = false;
        } else {
          this.infectable = true;
        }
      } else {
        this.infectable = false;
      }
    }
  }
  timeend() {
    if (Math.random() <= this.st.heal) {
      if (this.st.transform >= 0) this.toState(this.st.transform);
      else this.toState(Math.floor(random(states.length)));
    } else {
      this.dead();
    }
  }
  dead() {
    if (this.alive) {
      if (this.land.type == 11 && this.land.pow > Math.random()) {
        this.toState(0);
      } else {
        this.alive = false;
        this.time = timeNow();
        this.frame = frame_;
        if (!this.st.after) {
          this.infectable = false;
          this.st.count.cells--;
          counter.cells--;
        } else {
          if (!this.infectable) {
            this.st.count.cells--;
            counter.cells--;
          }
        }
        if (this.st.mosquito) {
          for (let i = 0; i < this.st.mosquito; i++) {
            mosq.push(new Mosquito(mosq.length, this.x, this.y, this.state));
          }
        }
      }
      if (this.land.type == 6 && this.land.pow > Math.random()) arr.push(new Rat(arr.length, this.x, this.y));
    }
  }
  handler() {
    if (this.alive) {
      if (this.land.type == 1 && this.land.pow > Math.random()) this.dead();
      if (this.land.type == 12 && this.land.pow/(this.st.builder ? 100:1) > Math.random()) this.dead();
      if (this.state && this.land.type == 2 && this.land.pow > Math.random()) this.toState(0);
      if (this.land.type == 7 && this.land.pow > Math.random() && this.st.allergy != -1) this.toState(this.st.allergy);
      if (this.alive && this.land.type == 13 && this.land.pow > Math.random()) { this.dead(); arr[this.id] = new Rat(this.id, this.x, this.y, this.state); }
      if (this.state && this.land.type == 9 && this.land.pow > Math.random() && this.st.waterscary) this.dead();
      if (this.land.type == 10 && this.land.pow/1000 > Math.random()) explosion();
      if (this.st.time && this.time+this.st.time <= timeNow()) this.timeend();
    }
    if (this.restend && this.restend < timeNow() && this.alive) {
      this.infectable = true;
      this.restend = false;
    }
    if ((!this.alive) && this.infectable && this.st.after+this.time < timeNow()) {
      this.infectable = false;
      this.st.count.cells--;
      counter.cells--;
    } 
    if ((this.infectable || (this.st.magnet && this.st.magnetpow && this.alive) || (this.st.parasite && this.alive)) && this.frame !== frame_) {
      let inzone = 0;
      for (let i = 0; i < arr.length; i++) {
        let p = arr[i];
        if (p.state != this.infect && p.state != this.state && p.alive) {
          if (p.type == "cell" && p.x >= this.x-this.st.magnet && p.x <= this.x+this.st.magnet && p.y >= this.y-this.st.magnet && p.y <= this.y+this.st.magnet) {
            let c = (this.st.magnet-Math.sqrt(((this.x-p.x)**2)+((this.y-p.y)**2)))/this.st.magnet;
            p.magnet = {};
            p.magnet.y = p.y < this.y ? this.st.magnetpow*c:-this.st.magnetpow*c;
            p.magnet.x = p.x < this.x ? this.st.magnetpow*c:-this.st.magnetpow*c;
          }
          if (((this.land.type == 3 && this.land.pow > Math.random() && p.land.type == 3 && p.type == "cell") || (this.x-this.st.zone <= p.x && this.x+this.st.zone >= p.x && this.y-this.st.zone <= p.y && this.y+this.st.zone >= p.y)) && ! (this.land.type == 14 && this.land.pow > Math.random() && p.land.type == 14 && p.type == "cell")) {
            inzone++;
            if (Math.random() < this.st.prob*(this.land.type == 5 ? this.land.pow+1:1) && (p.st.protect ?? 0)-(this.st.spikes ?? 0) < Math.random()) {
              if (Math.random() < this.st.killer) {
                p.dead();
              } else {
                p.toState(this.infect);
              }
              for (let i = 0; i < this.st.farinf; i++) arr[Math.floor(random(arr.length))].toState(this.state);
            } else {
              if (Math.random() < this.st.attacktrans && p.state != this.st.transform) {
                p.toState(this.transform ?? 0);
              } else {
                if (Math.random() < p.st.cattack) this.toState(p.state);
              }
            }
          }
        }
      }
      if (this.alive && inzone == 0 && this.st.parasite) {
        if (!this.parasitetime) this.parasitetime = timeNow();
      } else {
        this.parasitetime = false;
      }
    }
    if (this.st.parasite && this.alive && this.parasitetime && this.parasitetime+this.st.parasite < timeNow()) this.dead();
  }
  move() {
    if (this.alive) {
      if (this.st.crazy/10 > Math.random()) this.speed = { x: random(options.speed)-(options.speed/2), y: random(options.speed)-(options.speed/2) };
      let c = this.land.type == 4 ? 1-(this.land.pow):1;
      if (this.st.robber && options.quar) this.home = { minx: Math.max(style.size/2, this.x-options.quar), miny: Math.max(style.size/2, this.y-options.quar), maxx: Math.min(options.size-(style.size/2), this.x+options.quar), maxy: Math.min(options.size-(style.size/2), this.y+options.quar) };
      let home = Object.assign({}, this.home);
      if (!this.st.builder) {
        let px = options.size/landscape.res;
        if (this.land.x != landscape.res-1) {
          if (landscape.type[this.land.x+1][this.land.y] == 12) home.maxx = Math.min(home.maxx, ((this.land.x+1)*px)-(style.size/2));
        }
        if (this.land.x != 0) {
          if (landscape.type[this.land.x-1][this.land.y] == 12) home.minx = Math.max(home.minx, (this.land.x*px)+(style.size/2));
        }
        if (this.land.y != landscape.res-1) {
          if (landscape.type[this.land.x][this.land.y+1] == 12) home.maxy = Math.min(home.maxy, ((this.land.y+1)*px)-(style.size/2));
        }
        if (this.land.y != 0) {
          if (landscape.type[this.land.x][this.land.y-1] == 12) home.miny = Math.max(home.miny, (this.land.y*px)+(style.size/2));
        }
      }
      let magnet = this.magnet ?? { x: 0, y: 0 };
      this.x += (this.speed.x*(this.st.speed ?? 1)*c)+magnet.x;
      this.y += (this.speed.y*(this.st.speed ?? 1)*c)+magnet.y;
      if (this.x < home.minx) this.speed.x *=-1, this.x = home.minx;
      if (this.x > home.maxx) this.speed.x *=-1, this.x = home.maxx;
      if (this.y < home.miny) this.speed.y *=-1, this.y = home.miny;
      if (this.y > home.maxy) this.speed.y *=-1, this.y = home.maxy;
      {
        let px = options.size/landscape.res;
        this.land = { x: Math.floor(this.x/px), y: Math.floor(this.y/px) };
        this.land.type = this.st.antiland > Math.random() ? 0:landscape.type[this.land.x][this.land.y];
        this.land.pow = landscape.pow[this.land.x][this.land.y];
      }
    }
  }
  render() {
    if (!this.st.invisible) {
      if (this.alive) {
        if (this.teleportated) {
          if (frame_ < this.frame+5 && style.anim && this.frame !== false) {
            let fram = frame_-this.frame;
            let cellTrans = this.st.transparent ? 128:255;
            let trans = cellTrans*fram/5;
            ctx.fillStyle = this.st.color + ahex(trans);
            ctx.fillRect(X((this.x-(style.size/2)*scale)+15), Y((this.y-(style.size/2)*scale)+15), X(style.size*scale), Y(style.size*scale));
            cellTrans = this.teleportated.st.transparent ? 128:255;
            trans = cellTrans*fram/5;
            ctx.fillStyle = this.teleportated.st.color+ ahex(255-trans);
            ctx.fillRect(X((this.teleportated.x-(style.size/2)*scale)+15), Y((this.teleportated.y-(style.size/2)*scale)+15), X(style.size*scale), Y(style.size*scale));
          } else {
            let trans = this.st.transparent ? 128:255;
            ctx.fillStyle = this.st.color + ahex(trans);
            ctx.fillRect(X((this.x-(style.size/2))*scale+15), Y((this.y-(style.size/2))*scale+15), X(style.size*scale), Y(style.size*scale));
          }
        } else {
          let trans = this.st.transparent ? 128:255;
          ctx.fillStyle = this.st.color + ahex(trans);
          ctx.fillRect(X((this.x-(style.size/2))*scale+15), Y((this.y-(style.size/2))*scale+15), X(style.size*scale), Y(style.size*scale));
          if (this.magnet && style.anim) {
            let trans = this.st.transparent ? 64:128;
            ctx.fillStyle = this.st.color + ahex(trans);
            ctx.fillRect(X((this.x-(style.size))*scale+15), Y((this.y-(style.size))*scale+15), X(style.size*2*scale), Y(style.size*2*scale));
          } else {
            if (frame_ < this.frame+5 && style.chanim && this.frame !== false) {
              let fram = frame_-this.frame;
              let cellTrans = this.st.transparent ? 128:255;
              let trans = ahex(cellTrans*(5-fram)/10);
              let size = 2*style.size;
              ctx.fillStyle = this.st.color + trans;
              ctx.fillRect(X((this.x-(size/2))*scale+15), Y((this.y-(size/2))*scale+15), X(size*scale), Y(size*scale));
            }
          }
        }
      } else {
        if (frame_ < this.frame+15 && style.deadanim) {
          let fram = frame_-this.frame;
          let size = (fram/7.5+1)*style.size;
          let cellTrans = this.st.transparent ? 128:255;
          let trans = ahex(cellTrans*(15-fram)/15);
          ctx.fillStyle = this.st.color + trans;
          ctx.fillRect(X((this.x-(size/2))*scale+15), Y((this.y-(size/2))*scale+15), X(size*scale), Y(size*scale));
        }
      }
    }
  }
  first() {
    if (!this.alive) {
      if (this.infectable) {
        let cellTrans = this.st.transparent ? 128:255;
        let fill = (x, y, s, x_, y_, c) => {
          ctx.fillStyle = c;
          ctx.fillRect(X((x_+(style.size*x))*scale+15), Y((y_+(style.size*y))*scale+15), X(s*style.size*scale), Y(s*style.size*scale));
        };
        fill(-0.75, -0.75, 0.6, this.x, this.y, this.st.color + ahex(cellTrans/3*(style.anim ? Math.sin(degToRad(frame_*30))+1:1)));
        fill(0.75, -0.75, 1, this.x, this.y, this.st.color + ahex(cellTrans/3*(style.anim ? Math.sin(degToRad(frame_*30+180))+1:1)));
        fill(-0.75, 0.75, 1, this.x, this.y, this.st.color + ahex(cellTrans/3*(style.anim ? Math.sin(degToRad(frame_*30+180))+1:1)));
        fill(0.75, 0.75, 0.8, this.x, this.y, this.st.color + ahex(cellTrans/3*(style.anim ? Math.sin(degToRad(frame_*30))+1:1)));
      } else {
        if (style.dots) {
          let cellTrans = this.st.transparent ? 128:255;
          ctx.fillStyle = (style.dots.color == "ill" ? this.st.color:style.dots.color) + (style.dots.transparent ? ahex(cellTrans-80):"");
          ctx.fillRect(X(this.x*scale+15-(style.dots.size/2)), Y(this.y*scale+15-(style.dots.size/2)), X(style.dots.size*scale), Y(style.dots.size*scale));
        }
      }
    }
  }
  end() {
    this.magnet = null;
  }
}
class  Mosquito {
  constructor(id, x, y, state) {
    this.x = x;
    this.y = y;
    this.speed = { x: random(options.mosquitospeed)-(options.mosquitospeed/2), y: random(options.mosquitospeed)-(options.mosquitospeed/2) };
    this.state = state;
    this.id = id;
    this.alive = true;
    this.st = states[this.state];
    this.time = timeNow();
    this.type = "mosquito";
    {
      let px = options.size/landscape.res;
      this.land = { x: Math.floor(this.x/px), y: Math.floor(this.y/px) };
      this.land.type = landscape.type[this.land.x][this.land.y];
      this.land.pow = landscape.pow[this.land.x][this.land.y];
    }
  }
  render() {
    if (this.alive) {
      let x_ = style.anim ? Math.cos(degToRad(frame_*30))*style.mosquitosize*1.5:0;
      let y_ = style.anim ? Math.sin(degToRad(frame_*30))*style.mosquitosize*1.5:0;
      let trans = this.st.transparent ? 128:255;
      ctx.fillStyle = this.st.color + ahex(trans);
      ctx.fillRect(X(testCordMinMax(this.x-(style.mosquitosize/2)+x_, style.mosquitosize)*scale+15), Y(testCordMinMax(this.y-(style.mosquitosize/2)+y_, style.mosquitosize)*scale+15), X(style.mosquitosize*scale), Y(style.mosquitosize*scale));
      ctx.fillStyle = this.st.color + ahex(trans/2);
      ctx.fillRect(X(testCordMinMax(this.x-(style.mosquitosize)+x_, style.mosquitosize*2)*scale+15), Y(testCordMinMax(this.y-(style.mosquitosize)+y_, style.mosquitosize*2)*scale+15), X(style.mosquitosize*2*scale), Y(style.mosquitosize*2*scale)); 
    }
  }
  handler() {
    if (this.land.type == 8 && this.land.pow > Math.random()) this.alive = false;
    if (this.alive) {
      for (let i = 0; i < arr.length; i++) {
        let p = arr[i];
        if (p.state != this.state && p.alive) {
          if (this.x - options.mosquitozone <= p.x && this.x + options.mosquitozone >= p.x && this.y - options.mosquitozone <= p.y && this.y + options.mosquitozone >= p.y) {
            if (Math.random() < options.mosquitoprob && (p.st.protect ?? 0) < Math.random()) {
              p.toState(this.state);
            }
          }
        }
      }
      if (options.mosquitotime && this.time+options.mosquitotime < timeNow()) this.alive = false;
      {
        let home = { minx: style.mosquitosize/2, miny: style.mosquitosize/2, maxx: options.size-(style.mosquitosize/2), maxy: options.size-(style.mosquitosize) };
        this.x += this.speed.x;
        this.y += this.speed.y;
        if (this.x < home.minx) this.speed.x *=-1, this.x = home.minx;
        if (this.x > home.maxx) this.speed.x *=-1, this.x = home.maxx;
        if (this.y < home.miny) this.speed.y *=-1, this.y = home.miny;
        if (this.y > home.maxy) this.speed.y *=-1, this.y = home.maxy;
        {
          let px = options.size/landscape.res;
          this.land = { x: Math.floor(this.x/px), y: Math.floor(this.y/px) };
          this.land.type = landscape.type[this.land.x][this.land.y];
          this.land.pow = landscape.pow[this.land.x][this.land.y];
        }
      }
    }
  }
}
class Rat {
  constructor(id, x, y, state) {
    this.x = x ?? random(options.size);
    this.y = y ?? random(options.size);
    this.speed = { x: random(options.ratspeed)-(options.ratspeed/2), y: random(options.ratspeed)-(options.ratspeed/2) };
    this.state = state ?? 0;
    this.id = id;
    this.alive = true;
    this.time = timeNow();
    this.st = states[this.state];
    this.infectable = false;
    this.frame = this.state ? 0:false;
    this.infect = this.st.infect ?? this.state;
    this.infectable = this.st.zone && this.st.prob;
    this.type = "rat";
    counter.rats++;
    this.st.count.rats++;
    {
      let px = options.size/landscape.res;
      this.land = { x: Math.floor(this.x/px), y: Math.floor(this.y/px) };
      this.land.type = landscape.type[this.land.x][this.land.y];
      this.land.pow = landscape.pow[this.land.x][this.land.y];
    }
    if (state) this.toState(state);
  }
  toState(state) {
    if (this.alive) {
      let laststate = this.st;
      this.st.count.rats--;
      this.state = state;
      this.time = timeNow();
      this.frame = frame_;
      this.st = states[this.state];
      this.infect = this.st.infect ? this.st.infect-1:this.state;
      this.st.count.rats++;
      this.infectable = this.st.prob && this.st.zone;
    }
  }
  dead() {
    if (this.alive) {
      this.alive = false;
      this.time = timeNow();
      this.frame = frame_;
      this.st.count.rats--;
      counter.rats--;
    }
  }
  handler() {
    if (this.land.type == 8 && this.land.pow > Math.random()) this.dead();
    if (this.infectable && this.frame !== frame_) {
      for (let i = 0; i < arr.length; i++) {
        let p = arr[i];
        if (p.state != this.infect && p.state != this.state && p.alive && p.type == "cell") {
          if (this.x-this.st.zone <= p.x && this.x+this.st.zone >= p.x && this.y-this.st.zone <= p.y && this.y+this.st.zone >= p.y) {
            if (Math.random() < this.st.prob && (p.st.protect ?? 0) < Math.random()) p.toState(this.infect);
          }
        }
      }
    }
  }
  move() {
    if (this.alive) {
      let home = { minx: style.ratsize/2, miny: style.ratsize/2, maxx: options.size-(style.ratsize/2), maxy: options.size-(style.ratsize/2) };
      this.x += this.speed.x;
      this.y += this.speed.y;
      if (this.x < home.minx) this.speed.x *=-1, this.x = home.minx;
      if (this.x > home.maxx) this.speed.x *=-1, this.x = home.maxx;
      if (this.y < home.miny) this.speed.y *=-1, this.y = home.miny;
      if (this.y > home.maxy) this.speed.y *=-1, this.y = home.maxy;
      {
        let px = options.size/landscape.res;
        this.land = { x: Math.floor(this.x/px), y: Math.floor(this.y/px) };
        this.land.type = landscape.type[this.land.x][this.land.y];
        this.land.pow = landscape.pow[this.land.x][this.land.y];
      }
    }
  }
  render() {
    if (!this.st.invisible) {
      let fig = function(obj, size) {
        let px = size*style.ratsize;
        let l = px/2;
        ctx.beginPath();
        ctx.moveTo(X((obj.x-l)*scale+15), Y((obj.y+l)*scale+15));
        ctx.lineTo(X((obj.x+l)*scale+15), Y((obj.y+l)*scale+15));
        ctx.lineTo(X(obj.x*scale+15), Y((obj.y-l)*scale+15));
        ctx.closePath();
        ctx.fill();
      };
      if (this.alive) {
        let trans = this.st.transparent ? 128:255;
        ctx.fillStyle = this.st.color + ahex(trans);
        fig(this, 1);
        if (frame_ < this.frame+5 && style.chanim && this.frame !== false) {
          let fram = frame_-this.frame;
          let cellTrans = this.st.transparent ? 128:255;
          let trans = ahex(cellTrans*(5-fram)/10);
          ctx.fillStyle = this.st.color + trans;
          fig(this, 2);
        }
      } else {
        if (frame_ < this.frame+15 && style.deadanim) {
          let fram = frame_-this.frame;
          let size = fram/7.5+1;
          let cellTrans = this.st.transparent ? 128:255;
          let trans = ahex(cellTrans*(15-fram)/15);
          ctx.fillStyle = this.st.color + trans;
          fig(this, size);
        }
      }
    }
  }
  first() {}
  end() {}
}
function frame() {
  if (counter.cells+counter.rats > 0 || !options.stop) {
    let FPS = Math.floor(10000/(performance.now()-lastTime))/10;
    let start = performance.now();
    lastTime = performance.now();
    if (!pause) {
      let counts_ = [];
      for (let i = 0; i < states.length; i++) {
        counts_[i] = states[i].count.cells+states[i].count.rats;
      }
      counts.push(counts_);
    }
    clear();
    ctx.fillStyle = "#d0d0d0";
    ctx.fillRect(0, 0, X(450), Y(450));
    ctx.fillStyle ="#ffffff";
    ctx.fillRect(X(15), Y(15), X(420), Y(420));
    let px = 420/landscape.res;
    for (let x = 0; x < landscape.res; x++) {
      for (let y = 0; y < landscape.res; y++) {
        ctx.fillStyle = lands[landscape.type[x][y]] + ahex(landscape.pow[x][y]*120);
        ctx.fillRect(X(x*px+15), Y(y*px+15), X(px), Y(px));
      }
    }
    if (!pause) {
      for (let i = 0; i < arr.length; i++) {
        arr[i].handler();
      }
      for (let i = 0; i < mosq.length; i++) {
        mosq[i].handler();
      }
      for (let i = 0; i < states.length; i++) {
        let ill = states[i];
        if (ill.addtime && ill.addcount && (ill.countadd == 0 || ill.added < ill.countadd)) {
          if (ill.addtime+ill.lastadd < timeNow()) {
            for (let j = 0; j < ill.addcount; j++) {
              arr[Math.floor(random(arr.length))].toState(i);
            }
            ill.lastadd = timeNow();
            ill.added++;
          }
        }
      }
    }
    for (let i = 0; i < arr.length; i++) {
      arr[i].first();
    }
    for (let i = 0; i < arr.length; i++) {
      arr[i].render();
    }
    for (let i = 0; i < mosq.length; i++) {
      mosq[i].render();
    }
    if (!pause) {
      for (let i = 0; i < arr.length; i++) {
        arr[i].move();
      }
      for (let i = 0; i < arr.length; i++) {
        arr[i].end();
      }
    }
    if (!style.onlygame) {
      ctx.font = `${X(18)}px Monospace`;
      ctx.fillStyle = "#000000";
      ctx.fillText(`Время: ${flr(timeNow()/1000)}с`, X(490), Y(style.biggraph ? 260:30));
      ctx.fillText(`FPS: ${flr(FPS) + " x" + (options.showspeed ?? 1)}`, X(490), Y(style.biggraph ? 290:60));
      if (!style.biggraph) ctx.fillText("Статистика:", X(490), Y(120));
      ctx.fillText(`${counter.cells+counter.rats}${counter.rats > 0 ? ` (${counter.cells})`:""} | сумма`, X(490), Y(style.biggraph ? 350:150));
      sort();
      ctx.font = `${X(Math.min(Math.floor(9/states.length*18), 18))}px Monospace`;
      if (style.biggraph) {
        biggraph();
      } else {
        for (let i = 0; i < sorted.length; i++) {
          let st = sorted[i];
          ctx.fillStyle = st.color + (st.transparent ? "80":"ff");
          ctx.fillText(`${st.count.cells+st.count.rats}${st.count.rats ? ` (${st.count.cells})`:""} | ${st.name} ${st.invisible? "(невидим)":""}`, X(490), Y(180+(i*Math.min(Math.floor(9/states.length*30), 30))));
        }
        if (frame_%(options.graph ?? 1) == 0) updateGraph();
        ctx.putImageData(graph, X(650), Y(10));
      }
    }
    ctx.fillStyle = "#d0d0d0";
    ctx.fillRect(0, 0, X(450), Y(15));
    ctx.fillRect(0, Y(435), X(450), Y(15));
    ctx.fillRect(0, 0, X(15), Y(450));
    ctx.fillRect(X(435), 0, X(15), Y(450));
    ctx.fillStyle = "#d0d0d0";
    if (pause) {
      ctx.beginPath();
      ctx.moveTo(X(850), Y(400));
      ctx.lineTo(X(870), Y(415));
      ctx.lineTo(X(850), Y(430));
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(X(800), Y(400), X(30), Y(30));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(X(807), Y(407), X(16), Y(16));
      ctx.fillRect(X(820), Y(415), X(16), Y(20));
      ctx.fillStyle = "#d0d0d0";
      ctx.beginPath();
      ctx.moveTo(X(834), Y(410));
      ctx.lineTo(X(825), Y(420));
      ctx.lineTo(X(818), Y(410));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(X(760), Y(400));
      ctx.lineTo(X(770), Y(400));
      ctx.lineTo(X(760), Y(410));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(X(790), Y(400));
      ctx.lineTo(X(780), Y(400));
      ctx.lineTo(X(790), Y(410));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(X(760), Y(430));
      ctx.lineTo(X(770), Y(430));
      ctx.lineTo(X(760), Y(420));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(X(790), Y(430));
      ctx.lineTo(X(780), Y(430));
      ctx.lineTo(X(790), Y(420));
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(X(770), Y(410), X(10), Y(10))
    } else {
      ctx.fillRect(X(850), Y(400), X(10), Y(30));
      ctx.fillRect(X(870), Y(400), X(10), Y(30));
      frame_++;
    }
    if (!style.onlygame) {
      ctx.fillStyle = "#000000";
      ctx.font = `${X(18)}px Monospace`;
      ctx.fillText(`Расчёт: ${Math.floor(performance.now()-start)}мс`, X(490), Y(style.biggraph ? 320:90));
    }
    maxFPS = 1000/(performance.now()-start);
  } else {
    clearInterval(interval);
  }
}
function click(e) {
  let c = cw/900;
  let x = (e.pageX-cx)/c;
  let y = (e.pageY-cy)/c;
  if (x > 850 && y > 400) {
    pause = !pause;
  }
  if (pause && x > 800 && x < 850 && y > 400) {
    start();
    pause = false;
  }
  if (pause && x > 760 && x < 790 && y > 400) {
    fullScreen(document.documentElement);
  }
  if (!pause && options.healzone && y >= 15 && y <= 435 && x >= 15 && x <= 435) {
    let x_ = (x-15)/420*options.size;
    let y_ = (y-15)/420*options.size;
    let zone = options.healzone;
    for (let i = 0; i < arr.length; i++) {
      let p = arr[i];
      if (p.y >= y_-zone && p.y <= y_+zone && p.x >= x_-zone && p.x <= x_+zone) {
        p.toState(0);
      }
    }
  }
}
function start() {
  arr = [];
  counts = [];
  mosq = [];
  frame_ = 0;
  counter = { cells: 0, rats: 0 };
  states[0].count = { cells: 0, rats: 0 };
  for (let i = 1, j = 0; i < states.length; i++) {
    let ill = states[i];
    ill.count = { cells: 0, rats: 0 };
    ill.lastadd = 0;
    ill.added = 0;
    for (let k = 0; k < ill.initial; k++, j++) {
      let x = null, y = null;
      if (ill.position && ill.position.length > k) x = ill.position[k].x, y = ill.position[k].y;
      arr.push(new Cell(j, x, y, i));
    }
  }
  for (let i = arr.length; i < options.count; i++) {
    arr.push(new Cell(i));
  }
  for (let i = arr.length, l = 0; l < options.ratcount; i++, l++) {
    arr.push(new Rat(i));
  }
  sort();
}
start();
addEventListener('click', () => {
  music.loop = true;
  if (options.music) music.play();
  interval = setInterval(() => { if (performance.now() >= lastTime+fpsTime) frame(); }, 1);
  started = true;
  document.addEventListener('click', click);
}, { once: true });