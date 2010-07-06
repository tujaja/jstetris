var Timer = {
  get_time :function() {
    var time = new Date();
    var min =  time.getMinutes();
    var msec = time.getMilliseconds();
    var sec =  time.getSeconds();

    return min * 60000 + sec * 1000 + msec;
  }
}

//////////////////////////////////////////////////////////////////

var Block = function(x,y,color) {
  this.x = x;
  this.y = y;
  this.color = color;

  this.element = new Element('div', {class:'block'});

  $('main').insert(this.element);
}

Block.prototype.render = function() {
  this.element.setStyle( 'top :' + (this.y*20).toString() + 'px' );
  this.element.setStyle( 'left :' + (this.x*20).toString() + 'px' );
  this.element.setStyle( 'background-color:' + this.color );
}

Block.prototype.remove = function() {
  this.element.remove();
  this.element = null;
}


//////////////////////////////////////////////////////////////////
var Bar = function() {
  this.x = 0;
  this.y = 0;
  this.blocks = [];
  this.colors = ['darkseagreen', 'blueviolet', 'pink', 'orange', 'coral', 'darkcyan', 'lightskyblue'];
  var rand = Math.floor(Math.random()*7);

  // initialize blocks
  var data = this.rawdata[rand];
  var color = this.colors[rand];

  for (var y=0; y < data.length; y++) {
    var line = data[y];
    var block_line = new Array();
    for (var x=0; x < line.length; x++) {
      if ( line[x] == 1) {
        block_line[x] =  new Block(this.x+x, this.y+y, color);
      }
      else {
        block_line[x] = null;
      }
    }
    this.blocks[y] = block_line;
  }
}


Bar.prototype.rawdata = [
  [ [0,0,0,0], [0,1,1,0,], [0,1,0,0], [0,1,0,0] ],
  [ [0,1,0,0], [0,1,0,0,], [0,1,0,0], [0,1,0,0] ],
  [ [0,0,1,0], [0,1,1,0,], [0,1,0,0], [0,0,0,0] ],
  [ [0,1,0,0], [0,1,1,0,], [0,0,1,0], [0,0,0,0] ],
  [ [0,0,0,0], [0,1,0,0,], [1,1,1,0], [0,0,0,0] ],
  [ [0,0,0,0], [0,1,1,0,], [0,1,1,0], [0,0,0,0] ],
  [ [0,0,0,0], [0,1,1,0,], [0,0,1,0], [0,0,1,0] ]
]

Bar.prototype.each_blocks = function( proc ) {

  // iterate each blocks and exec function
  for (var y=0; y < this.blocks.length; y++) {
    var line = this.blocks[y];
    for (var x=0; x < line.length; x++) {
      var block = line[x];
      if (block != null) {
        //block.proc(this, x, y); //こういう書き方はできない
        proc.call(this, block, x, y);
      }
    }
  }
}

Bar.prototype.update = function() {
  this.each_blocks( function(block,lx,ly) {
      block.x = this.x + lx;
      block.y = this.y + ly;
    }
  );
}

Bar.prototype.render = function() {
  this.each_blocks( function(block) {
      block.render();
    }
  );
}

Bar.prototype.move = function(tx, ty) {
  this.x += tx;
  this.y += ty;
  this.update();
}

Bar.prototype.revolve = function(dir) {
  var temp = [];

  for (var y=0; y<this.blocks.length; y++) {
    var temp_line = [];
    for (var x=0; x<this.blocks.length; x++) {
      if (dir==1) {
        var line = this.blocks[x];
        temp_line[x] = line[3-y];
      }
      else {
        var line = this.blocks[3-x];
        temp_line[x] = line[y];
      }
    }
    temp.push(temp_line);
  }
  this.blocks = temp;

  this.update();
}


//////////////////////////////////////////////////////////////////

var Stage = function(w, h) {
  this.width = w;
  this.height = h;
  this.blocks = [];

  // initialize blocks;
  for (var y=0; y < this.height; y++) {
    var line = [];
    for (var x=0; x < this.width; x++) {
      line[x] = null;
    }
    this.blocks.push(line);
  }
}

Stage.prototype.get_block = function(x,y) {
  var line = this.blocks[y];
  return line[x];
}

Stage.prototype.set_block = function(block) {
  var line = this.blocks[block.y];
  line[block.x] = block;
}

Stage.prototype.outbounded = function(bar) {
  var out = false;
  var stage = this;

  bar.each_blocks( function(block, lx, ly) {
      if (bar.x + lx < 0 || bar.x + lx >= stage.width ||
          bar.y + ly < 0 || bar.y + ly >= stage.height) { out = true; }
    }
  );
  return out;
}

Stage.prototype.overwrapped = function(bar) {
  var wrapped = false;
  var stage = this;

  bar.each_blocks( function(block, lx, ly) {
      if ( stage.get_block(bar.x + lx, bar.y + ly) ) {
        wrapped = true;
      }
    }
  );
  return wrapped;
}

Stage.prototype.tidy_up = function() {

  var n = 0;
  var delete_lines = [];
  var temp_blocks = [];

  for (var y=0; y<this.height; y++) {
    n = 0;
    for (var x=0; x<this.width; x++) {
      if (this.get_block(x, y)) { n++; }
    }
    var line = this.blocks[y];
    if (n == this.width) {
      delete_lines.push(line);

      // unshift new line
      var l = new Array(this.width);
      for (var i=0; i<l.length; i++) { l[i] = null; }
      temp_blocks.unshift(l);

    } else {
      temp_blocks.push(line);
    }
  }

  for (var y=0; y<delete_lines.length; y++) {
    var line = delete_lines[y];
    for (var x=0; x<line.length; x++) {
      line[x].remove();
    }
  }

  this.blocks = temp_blocks;
  this.update();
}

Stage.prototype.update = function() {
  for (var y=0; y<this.height; y++) {
    var line = this.blocks[y];
    for (var x=0; x<this.width; x++) {
      var block = line[x];
      if (block) { 
        block.x = x;
        block.y = y;
        block.render();
      }
    }
  }
}


//////////////////////////////////////////////////////////////////

var InputManager = function() {

  this.key_trigger = {};
  this.current_key_state = {};
  this.prev_key_state = {};


  Event.observe( document, 'keydown',
  (function(mgr) {
      return function(ev) { mgr.event_handler(ev); };
  })(this) );

  Event.observe( document, 'keyup',
  (function(mgr) {
      return function(ev) { mgr.event_handler(ev); };
  }) (this) );
}

InputManager.prototype.key_triggerd = function(key_str) {
  return this.key_trigger[key_str];
}

InputManager.prototype.key_pressed = function(key_str) {
  return this.previous_key_state[key_str];
}

InputManager.prototype.event_handler= function(ev) {
  var pressed = (ev.type == 'keydown') ? true : false;
  var code = ev.keyCode
  var str = String.fromCharCode(code);

  this.current_key_state[str] = pressed;
}

InputManager.prototype.update = function() {

  // clear triggers
  (function(self) {
    var hash = $H(self.key_trigger);
    var keys= hash.keys();
    for (var i=0; i<keys.length; i++) {
      self.key_trigger[ keys[i] ] = false;
    }
  }) (this);

  // update triggers
  var current_input = $H(this.current_key_state);
  var hash_keys= current_input.keys();

  for (var i=0; i<hash_keys.length; i++) {
    if (this.current_key_state[ hash_keys[i] ] == true) {
      if (this.previous_key_state[ hash_keys[i] ] == undefined ||
          this.previous_key_state[ hash_keys[i] ] == false) {

        this.key_trigger[ hash_keys[i] ] = true;
      }
    }
  }

  // clear
  this.previous_key_state = null;  // GC previous
  this.previous_key_state = this.current_key_state;
  this.current_key_state = new Object();
}

InputManager.prototype.render = function() {
}

//////////////////////////////////////////////////////////////////

var GameManager = function() {
  this.prev_time = 0;
  this.pre_exec_time = 0;
  this.diff_time = 0;
  this.FPS = 30;
  this.sleep = 1000/this.FPS;
  this.counter = 0;
  this.bar_landed = false;
  this.speed = 10;

  this.input_mgr = new InputManager();

  this.bar = new Bar();
  this.stage = new Stage(10,20);
}


GameManager.prototype.exec = function() {
  //$('notice').update('null');

  this.counter++;

  this.revolve_bar();
  this.move_bar();
  if (this.counter % this.speed == 0) { this.fall_bar();}


  if (this.bar_landed) {
    this.reflection_bar();
    this.bar = new Bar();
    this.bar_landed = false;
  }
}

GameManager.prototype.fall_bar = function() {
  this.bar.move(0, 1);

  if (this.collided(this.bar) == true) {
    this.bar.move(0, -1); // 元に戻す
    this.bar_landed = true;
  }
}

GameManager.prototype.move_bar = function() {
  var tx = 0;
  var ty = 0;

  if (this.input_mgr.key_pressed('J')) { ty = 1; }
  if (this.input_mgr.key_pressed('L')) { tx = 1; }
  if (this.input_mgr.key_pressed('H')) { tx = -1; }
  if (this.input_mgr.key_pressed('K')) { ty = -1; }

  if (tx == 0 && ty == 0) { return; }

  this.bar.move(tx, ty);

  if (this.collided(this.bar) == true) {
    this.bar.move(-tx, -ty); // 元に戻す
    if (ty == 1) {
      this.bar_landed = true;
      $('notice').update('landed');
    }
  }
}

GameManager.prototype.revolve_bar = function() {
  var dir = 0;
  if (this.input_mgr.key_triggerd('X')) { dir = 1; }
  if (this.input_mgr.key_triggerd('Z')) { dir = -1; }

  if (dir == 0) { return; }

  this.bar.revolve(dir);

  if (this.collided(this.bar) == true) {
    this.bar.revolve(-dir); // 元に戻す
  }
}

GameManager.prototype.render = function() {

  this.input_mgr.render();
  this.bar.render();
}

GameManager.prototype.collided = function(bar) {
  // outbound
  if (this.stage.outbounded(bar)) {
    $('notice').update('outbound');
    return true;
  }

  // wrapped
  if (this.stage.overwrapped(bar)) {
    $('notice').update('overwrapped:' + bar.x + ',' + bar.y);
    return true;
  }

  return false;
}

GameManager.prototype.reflection_bar = function() {
  var stage = this.stage;

  this.bar.each_blocks( function(block, lx, ly) {
      stage.set_block(block);
      block = null;
    }
  );

  this.stage.tidy_up();
}

GameManager.prototype.display_fps = function() {
  $('fps').update(this.counter);
}

GameManager.prototype.run = function() {
  var self = this;

  this.pre_exec_time = Timer.get_time();

  ///// FPS /////////
  this.diff_time = this.pre_exec_time - this.prev_time;
  if (this.diff_time > 1000) {
    this.prev_time = Timer.get_time();
    this.display_fps();
    this.counter = 0;
  }
  //////////////////

  this.input_mgr.update();
  this.exec();
  this.render();
  this.exec_time = Timer.get_time() - this.pre_exec_time;

  // sleep
  setTimeout(
    (function(g) {
      return function() { g.run(); };
    }) (this)
    , this.sleep - this.exec_time);

  // 無名関数とクロージャを使ってthisを保存する
}

//////////////////////////////////////////////////////////////////

Event.observe( window, 'load', function() {
  var g = new GameManager();

  g.run();
}
);
