var express = require('express'),
  client = require('radiodan-client');

console.log('Hello');

var on = false;
var playing = false;
var swapped = false;
var actionUserInitiated = false;
var currentTrackInt = -1;

var playlist = [
"EC_MP_1.WAV",
"EC_MP_2.WAV",
"EC_Thread_A.WAV",
"EC_MP_3.WAV",
"EC_MP_4.WAV",
"EC_Thread_B.WAV",
"EC_MP_5.WAV",
"EC_MP_6.WAV",
"EC_Thread_C.WAV",
"EC_MP_7.WAV",
"EC_MP_8.WAV",
"EC_Thread_D.WAV",
"EC_MP_9.WAV",
"EC_MP_10.WAV",
"EC_Thread_E.WAV",
"EC_MP_11.WAV"
];

var swaps = {
"EC_MP_2.WAV":"EC_Thread_A.WAV",
"EC_MP_4.WAV":"EC_Thread_B.WAV",
"EC_MP_6.WAV":"EC_Thread_C.WAV",
"EC_MP_8.WAV":"EC_Thread_D.WAV",
"EC_MP_10.WAV":"EC_Thread_E.WAV"
};

var swapValues = {
"EC_Thread_A.WAV": "EC_MP_2.WAV",
"EC_Thread_B.WAV": "EC_MP_4.WAV",
"EC_Thread_C.WAV": "EC_MP_6.WAV",
"EC_Thread_D.WAV": "EC_MP_8.WAV",
"EC_Thread_E.WAV": "EC_MP_10.WAV"
};


var radiodan = client.create();

// Get the player object called `main`
// as specified in ./config/radiodan-config.json
var player = radiodan.player.get('main');

// Get the button and RGBLED called 'power'
// Defined in ./config/radiodan-pcb.json
var powerButton = radiodan.button.get('power');
var powerLED = radiodan.RGBLED.get('power');
var magicButton = radiodan.button.get('magic');
var magicLED = radiodan.RGBLED.get('magic');

// Listen for updates to the music database
// to make sure that we've loaded any
// audio files in `./audio` before we try
// and play them
player.on('database.update.start', function() {
  console.log('database.update.start');
});
player.on('database.update.end', function() {
  console.log('database.update.end');
  init();
});
player.on('database.modified', function() {
  console.log('database.update.modified');
});

// button press swaps it

magicButton.on('release', function() {
  console.log('button was released');
  swap();
});

// power button starts it all off

powerButton.on('release', function() {
  if(on == false){ // it's off
    console.log("turning it on");
    //play then turn the button green
    on = true;
    play();
  }else{
    console.log("turning it off");
    on = false;
    stop();
  }
});


// Tell the player to update its database, discovering
// any audio files in the music directory specified in
// the config file.

player.updateDatabase();

// When the music database is updated then
// this will run (see `player.on` code above)
// Add everything to the playlist and then play it

function init() {
  console.log("init!");
  player.on('player', function (info) {
    //console.log('player event fired with data: ', info)
    time_elapsed = info.time;
    chooseWhatToDoNext(info);
  });

  //make power button red to show that we're working

  powerLED.emit({
    colour: [255, 0, 0]
  });
}

// add everything to the playlist and start to play it

function play() {
  start_time = new Date().getTime();
  player.add({
      clear: true,
      playlist: playlist
  }).then(player.play()).then(function(){
      console.log("playing has started");
      powerLED.emit({
        colour: [0, 255, 0]
      });
  });
}

// stop playing

function stop() {
  player.stop().then(function(){
    console.log("stopped");
    powerLED.emit({
      colour: [255, 0, 0]
    });
 });
}

// we're looking out for play events, which happen as the next item on the playlist happens
// if there's a swap available, we make the magic light blue, and set swapped to false
// if we are on a swapped thread, swapped already, we just play it
// otherwise we skip it
// anything else and we just play

function chooseWhatToDoNext(info){
  console.log("choosing what to do next");
  console.log(info);
  if(info.state == "play"){
     console.log("play found");
     console.log("song is "+info.song);
     // a swap is available
     if(swaps.hasOwnProperty(playlist[info.song])){ //i.e. if swaps has the key for the playlist item number
//info.song == 1 || info.song == 4 ||info.song == 7 ||info.song == 10 || info.song == 13){
        console.log("info.song is "+info.song+" and shluld be one of 1,4,7,10,13");
        swapped = false; //we're never swapped with these. I think.
        console.log("swap is available "+info.song);
        magicLED.emit({
          colour: [0, 0, 255]
        });
     }else if(swapValues.hasOwnProperty(playlist[info.song])){ // i.e. if our values have the playlist item number
        console.log("info.song is "+info.song+" and shluld be one of 2,5,8,11,14");
//info.song == 2 || info.song == 5 || info.song == 8 || info.song == 11 || info.song == 14){
        if(swapped){
          console.log("we are swapped so we just play it "+info.song);
        }else{
          console.log("this is a swap and we are not swapped - need to skip it "+info.song);
          player.next();
        }
     }else{
        swapped = false; // is this right??
        console.log("just a normal track, carry on ");
     }
  }else{
     console.log("info state is not stop "+info.state);
  }
}

// swap function
// turn the light off and skip to the next track

function swap(){ // we could probably do this better
  player.next().then(function(){
    magicLED.emit({
      colour: [0, 0, 0]
    });
  }).then(function(){
    swapped = true;
  });
}

/*
  Web
  This makes a web server available at
  localhost on the specified port, the
  default is 5000 so going to
  http://localhost:5000/ in a web browser
  will load `index.html` in ./static.
*/
var web = express(),
  port = process.env.WEB_PORT || process.env.PORT || 5000;

// Use the radiodan middleware to enable
// the web pages to send commands to this
// radio
web.use('/radiodan',
  client.middleware({
    crossOrigin: true
  })
);

// Make all files in ./static available to web
// pages
web.use(express.static(__dirname + '/static'));
web.listen(port);

console.log('Listening on port ' + port);

