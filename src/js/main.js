"use strict";

const GIPHY_BASE_URL = "https://api.giphy.com";
const GIPHY_RANDOM_PATH = "/v1/gifs/random";
const SEARCH_TAG = "workout";

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
    function pad(num) {
      return ("0" + num).slice(-2);
    }
    var minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

    var newCountdown = pad(minutes) + ":" + pad(seconds);
    if (this.clock.innerHTML !== newCountdown) {
      this.clock.innerHTML = newCountdown;
      var evt = new CustomEvent("clockChanged", {detail: {seconds: minutes * 60 + seconds}});
      document.dispatchEvent(evt);
    }
  },
  reset: function() {
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

  this.overlay = document.createElement("div");
  this.overlay.id = "overlay";
  this.overlay.appendChild(this.image);
}

GIF.prototype = {
  constructor: GIF,
  show: function() {
    document.body.appendChild(this.overlay);
    this.overlay.addEventListener("animationend", function() {
      this.overlay.classList.remove("fadeIn");
    }.bind(this));
    this.overlay.classList.add("fadeIn");
  },
  close: function() {
    this.overlay.addEventListener("animationend", function() {
      this.overlay.parentElement.removeChild(this.overlay);
    }.bind(this));
    this.overlay.classList.add("fadeOut");
  }
};

function getRandomGif() {
  return new Promise(function(resolve, reject) {
    if (!GIPHY_API_KEY) {
      reject("GIPHY_API_KEY is not defined.");
      return;
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
      "api_key": GIPHY_API_KEY,
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

var buzzer = new Audio("airhorn.mp3");

var lastShownGifSecond = 0;
var timer = new Timer();
var currentGif;
document.addEventListener("clockChanged", function(evt) {
  var seconds = evt.detail.seconds;
  if (seconds - lastShownGifSecond >= 3) {
    if (currentGif) {
      currentGif.close();
      currentGif = undefined;
    }
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
timer.addClock(document.getElementById("clock"));

// prime gif cache
newGifToCache();
