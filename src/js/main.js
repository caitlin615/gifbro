"use strict";

const GIPHY_BASE_URL = "https://api.giphy.com";
const GIPHY_RANDOM_PATH = "/v1/gifs/random";
const SEARCH_TAG = "workout";

var Timer = function() {
  this.button = undefined;
  this._startTime = null;
  this._intervalTimer = undefined;
  this._currentElapsed = null;
};
Timer.prototype = {
  constructor: Timer,
  addButton: function(el) {
    this.button = el;
    this.button.onclick = this.start.bind(this);
    this.reset();
  },
  start: function() {
    // TODO: Continue from where left off
    this.button.onclick = this.pause.bind(this);
    this.button.textContent = "Pause";
    this.button.classList.add("paused");
    if (!this._startTime) {
      this._startTime = performance.now();
    }
    this._intervalTimer = setInterval(function() {
      var now = performance.now();
      var elapsed = Math.floor(now - this._startTime);
      this.set(elapsed);
    }.bind(this), 100); // TODO: longer interval? using 1000 means an update might be missed
  },
  stop: function() {
    this.button.onclick = this.start.bind(this);
    this.button.textContent = "Start";
    this.button.classList.remove("paused");
    this.reset();
    if (this._intervalTimer) {
      clearInterval(this._intervalTimer);
    }
  },
  pause: function() {
    this.button.onclick = this.resume.bind(this);
    this.button.textContent = "Resume";
    this.button.classList.remove("paused");
    if (this._intervalTimer) {
      clearInterval(this._intervalTimer);
    }
  },
  resume: function() {
    this.button.onclick = this.pause.bind(this);
    this.button.textContent = "Pause";
    this.button.classList.add("paused");
    this._startTime = performance.now() - this._currentElapsed;
    this.start();
  },
  set: function(elapsed) {
    var elapsedSeconds = Math.floor(elapsed / 1000);
    var currentElapsed = Math.floor(this._currentElapsed / 1000);
    if (this._currentElapsed === null || elapsedSeconds !== currentElapsed) {
      this._currentElapsed = elapsed;
      var evt = new CustomEvent("clockChanged", {detail: {seconds: elapsedSeconds}});
      document.dispatchEvent(evt);
    }
  },
  reset: function() {
    this._startTime = null;
    this.set(0);
  }
};

var GIF = function(url) {
  this.image = new Image();
  this.image.id = "gif";
  this.image.src = url;
  this.loaded = false;
  this.image.onload = function() {
    this.loaded = true;
  }.bind(this);
}

GIF.prototype = {
  constructor: GIF,
  show: function() {
    document.body.appendChild(this.image);
    this.image.addEventListener("animationend", function() {
      this.image.classList.remove("fadeIn");
    }.bind(this));
    this.image.classList.add("fadeIn");
  },
  close: function() {
    this.image.addEventListener("animationend", function() {
      this.image.parentElement.removeChild(this.image);
    }.bind(this));
    this.image.classList.add("fadeOut");
  }
};

function getRandomGif() {
  return new Promise(function(resolve, reject) {
    var apiKey = window.GIPHY_API_KEY;
    if (!apiKey) {
      apiKey = "KTCS2iWTwvZXUiTx1ciM5JEQ0QMQ0YHQ"; // FIXME: This isn't good practice, but should get it working with github pages
    }
    var req = new XMLHttpRequest();
    req.addEventListener("load", function(e) {
      var resp = JSON.parse(req.response);
      if (resp.meta.status !== 200) {
        reject(resp.meta.msg);
        return;
      }
      // TODO: Return the image dimensions so gifs can be sized nicely in the DOM.
      // seems unnecessary at this point, but might be a nice feature, especially for smaller gif sizes
      resolve(resp.data.image_url);
    });
    var params = {
      "api_key": apiKey,
      "tag": SEARCH_TAG,
      "rating": "g",
      "fmt": "json", // json is the default
    };

    var query_params_string = "?";
    Object.keys(params).forEach(function(key) {
      query_params_string = query_params_string.concat(key + "=" + params[key] + "&");
    });
    var url = GIPHY_BASE_URL + GIPHY_RANDOM_PATH + query_params_string;
    req.open("GET", url);
    req.send();
  });
}

var gifCache = {
  cache: [],
  push: function(url) {
    gifCache.cache.push(new GIF(url));
  },
  pop: function() {
    var item = gifCache.cache.pop();
    if (item && item.loaded) {
      return item;
    }
    gifCache.cache.push(item);
    return null;
  },
};

function newGifToCache() {
  getRandomGif().then(gifCache.push).catch(function(err) {
    throw new Error(err);
  });
}

function updateClock(seconds) {
  function pad(num) {
    return ("0" + num).slice(-2);
  }
  var minutesValue = Math.floor((seconds % (1000 * 60 * 60)) / 60);
  var secondsValue = Math.floor((seconds % (1000 * 60)));

  var newCountdown = pad(minutesValue) + ":" + pad(secondsValue);
  var clock = document.getElementById("clock")
  if (clock.innerHTML !== newCountdown) {
    clock.innerHTML = newCountdown;
  }
}

var buzzer = new Audio("airhorn.mp3");
var currentGif;
var lastShownGifSecond = 0;

var timer = new Timer();
document.addEventListener("clockChanged", function(evt) {
  var seconds = evt.detail.seconds;
  updateClock(seconds);
  if (currentGif && (seconds - lastShownGifSecond >= 3)) {
    currentGif.close();
    currentGif = undefined;
  }
  if (seconds === 0) {
    // ignore reset
    return;
  }
  var showGifInterval = document.getElementById("interval").value;
  if (seconds % showGifInterval === 0) {
    currentGif = gifCache.pop();
    if (currentGif) {
      currentGif.show();
      lastShownGifSecond = seconds;
    }
    if (document.getElementById("buzzer").checked) {
      buzzer.play();
    }
    if (gifCache.cache.length < 5) {
      newGifToCache();
    }
  }
});
timer.addButton(document.getElementById("start"));
document.getElementById("stop").onclick = timer.stop.bind(timer);
// prime gif cache
newGifToCache();
