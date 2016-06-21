/*
 * midisentation.js
 * presentation remote pager via Web MIDI API
 * MIT licensed
 *
 * Copyright (C) 2015 aike, http://github.com/aike
 */

(function() {

  var click;
  if ("ontouchstart" in window) {
    click = "touchstart";
  } else {
    click = "mousedown";
  }

  // mode 0: note on 59 / note on 60
  // mode 1: note on 60 / note off 60
  var mode = 0;

  var activeSensing = false;

  var midi = null;
  var inputs = [];
  var outputs = [];

  navigator.requestMIDIAccess().then(onMidiSuccess, onMidiFailure);

  function onMidiSuccess(m){
    midi = m;

    var it = midi.inputs.values();
    for(var o = it.next(); !o.done; o = it.next()){
      inputs.push(o.value);
    }

    it = midi.outputs.values();
    for(var o = it.next(); !o.done; o = it.next()){
      outputs.push(o.value);
    }

    for(var i = 0; i < inputs.length; i++){
        inputs[i].onmidimessage = onMidiEvent;
    }
  }

  function onMidiFailure(msg){
    alert("Midi Failure: " + msg);
  }

  function noteOn(nn) {
    var it = midi.outputs.values();
    for (var o = it.next(); !o.done; o = it.next()) {
      o.value.send([0x90, nn, 0x40] , window.performance.now() );
    }
  }
  
  function noteOff(nn) {
    var it = midi.outputs.values();
    for (var o = it.next(); !o.done; o = it.next()) {
      o.value.send([0x80, nn, 0x00] , window.performance.now() );
    }
  }

  function onMidiEvent(event){
    if (event.data.length >= 1) {
      if (event.data[0] === 0xFE) {
        connectStatus = true;
        lastActiveSensing = Date.now();
      }
    }
  }

  ///////////////////////

  function colorResponse() {
    var elem = this;
    elem.style.opacity = 0.5;
    var fadefunc = function() {
      var opa = parseFloat(elem.style.opacity, 10);
      if (opa < 1.0) {
        opa += 0.1;
        elem.style.opacity = opa;
        setTimeout(fadefunc, 20);
      }
    };
    setTimeout(fadefunc, 20);
  }

  var div;
  div = document.querySelector("#left");
  div.addEventListener(click, colorResponse, false);
  if (mode === 0) {
    div.addEventListener(click, function() { noteOn(59); }, false);
  } else {
    div.addEventListener(click, function() { noteOn(60); }, false);    
  }

  div = document.querySelector("#right");
  div.addEventListener(click, colorResponse, false);
  if (mode === 0) {
    div.addEventListener(click, function() { noteOn(60); }, false);
  } else {
    div.addEventListener(click, function() {noteOff(60); }, false);    
  }

  //////////////////////////////////
  var connectStatus = false;
  var lastConnectStatus = false;
  var lastActiveSensing;
  var head = document.querySelector("#head");

  function updateIndicator() {
      if (connectStatus || !activeSensing) {
        head.style.background = '-webkit-gradient(radial, center center, 20, center center, 150, from(#9999bb), to(#7777aa))';
        head.style.boxShadow = '0 0 10px #44b, 0 0 15px #77e';
      } else {
        head.style.background = '-webkit-gradient(radial, center center, 20, center center, 150, from(#aa7777), to(#885555))';
        head.style.boxShadow = '0 0 10px #b44, 0 0 15px #e77';
      }    
      lastConnectStatus = connectStatus;
  }

  updateIndicator();

  if (activeSensing) {
    setInterval(function() {
      if (Date.now() - lastActiveSensing > 3000) {
        connectStatus = false;
      }
      if (connectStatus != lastConnectStatus) {
        updateIndicator();
      }
    }, 1000);
  }

  //////////////////////////////////

  var Timer = function() {
    this.stat = false;
    this.min = 0;
    this.sec = 0;
    this.minElem = document.querySelector("#minute");
    this.secElem = document.querySelector("#second");
    this.colElem = document.querySelector("#colon");

    var self = this;
    setInterval(function() {
      if (self.stat) {
        // blink colon
        self.colElem.style.opacity = 0;
        setTimeout(function() { self.colElem.style.opacity = 1; }, 300);
        // update timer view
        self.sec++;
        if (self.sec > 60) {
          self.sec -= 60;
          self.min++;
        }
        self.showTime();
      }
    }, 1000);

    var div = document.querySelector("#minute");
    div.addEventListener(click, colorResponse, false);
    div.addEventListener(click, function() {
      self.stat = false;
      self.min = 0;
      self.sec = 0;
      self.showTime();
    }, false);

    div = document.querySelector("#second");
    div.addEventListener(click, colorResponse, false);
    div.addEventListener(click, function() {
      self.stat = !self.stat;
    }, false);
  };

  Timer.prototype.showTime = function() {
    var sec = this.sec.toString();
    if (this.sec < 10)
      sec = "0" + sec;
    this.secElem.innerText = sec;
    var min = this.min.toString();
    if (this.min < 10)
      min = "0" + min;
    this.minElem.innerText = min;
  };

  var timer = new Timer();

})(); 

