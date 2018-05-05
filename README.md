GifBro: For the Gym Bro -- The World's ONLY Gif-Powered Workout Timer!
---------

A simple workout timer that shows you a random gif on an interval to help motivate you
through your workout.

Powered by [Giphy](https://giphy.com/).

### TODO
- [x] pre-load next gif
- [x] use timer to keep track of closing the gif.
- [x] animations for showing/closing gif
- [ ] add motivational quotes
- [ ] add text for interval input to explain it
- [x] Env var for API key
- [ ] enlarge smaller gifs
- [ ] onClockChanged should be a `CustomEvent`
- [ ] Pause the timer instead of just resetting it
- [ ] Audio on interval changes

### Giphy API Key
Create a Giphy Application and get an API Key [here](https://developers.giphy.com/).

You should then create the file `src/js/config.js` and define your Giphy API Key as `GIPHY_API_KEY`. This file is git-ignored and shouldn't be committed.
