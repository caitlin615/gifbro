"use strict";

function pad(num) {
  return ("0" + num).slice(-2);
}

var Timer = function() {
  this.button = undefined;
  this.clock = undefined;
  this._startTime = undefined;
  this._intervalTimer = undefined;
};
Timer.prototype = {
  constructor: Timer,
  addButton: function(el) {
    this.button = el;
    this.button.onclick = this.start.bind(this);
  },
  addClock: function(el) {
    this.clock = el;
    this.reset();
  },
  start: function() {
    // TODO: Continue from where left off
    this.button.onclick = this.stop.bind(this);
    this.button.textContent = "Stop";
    this._startTime = new Date().getTime();
    this._intervalTimer = setInterval(function() {
      var now = new Date().getTime();
      var elapsed = now - this._startTime;
      this.set(elapsed);
    }.bind(this), 100); // TODO: longer interval? using 1000 means an update might be missed
  },
  stop: function() {
    this.button.onclick = this.start.bind(this);
    this.button.textContent = "Start";
    this.reset();
    if (this._intervalTimer) {
      clearInterval(this._intervalTimer);
    }
  },
  set: function(elapsed) {
    var minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

    var newCountdown = pad(minutes) + ":" + pad(seconds);
    if (this.clock.innerHTML !== newCountdown) {
      this.clock.innerHTML = newCountdown
    }
  },
  reset: function() {
    this.set(0);
  }
};

var timer = new Timer();
timer.addButton(document.getElementById("start"));
timer.addClock(document.getElementById("clock"));
