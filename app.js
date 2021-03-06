
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
//var http = require('http');
var path = require('path');
var b = require('bonescript');

var app = express();

//setup temp
var millivolts,temp_f,temp_c;



//setup the LEDs
var redLED = "P8_17";
var greenLED = "P8_16";
var yellowLED = "P8_15";

b.pinMode(redLED, b.OUTPUT);
b.pinMode(greenLED, b.OUTPUT);
b.pinMode(yellowLED, b.OUTPUT);


//setup the RGB LED
var redRGB = "P8_13";
var greenRGB = "P8_19";
var blueRGB = "P9_14";

b.pinMode(redRGB, b.OUTPUT);
b.pinMode(greenRGB, b.OUTPUT);
b.pinMode(blueRGB, b.OUTPUT);

b.analogWrite(redRGB,0);
b.analogWrite(greenRGB,0);
b.analogWrite(blueRGB,0);

// all environments
app.set('port', process.env.PORT || 3100);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var server = app.listen(app.get('port'));
var io = require('socket.io').listen(server);

io.enable('browser client etag');
io.set('log level', 3);

io.set('transports', [
'websocket'
, 'flashsocket'
, 'htmlfile'
, 'xhr-polling'
, 'jsonp-polling'
]);


io.configure('development', function(){
  io.set('transports', ['websocket']);
});

//broadcast temp
setInterval(function(){
    b.analogRead('P9_40', getTemp);
    io.sockets.emit("temp",{f : temp_f, c : temp_c});
},300);

io.sockets.on("connection",function(socket){
    socket.on('redLED', function (data) {
        if(data.state == 1) {
            console.log("red on");
            b.digitalWrite(redLED, b.HIGH);
        } else {
            console.log("red off");
            b.digitalWrite(redLED, b.LOW);
        }


    });

    socket.on('greenLED', function (data) {
        if(data.state == 1) {
            console.log("green on");
            b.digitalWrite(greenLED, b.HIGH);
        } else {
            console.log("green off");
            b.digitalWrite(greenLED, b.LOW);
        }
    });

    socket.on('yellowLED', function (data) {
        if(data.state == 1) {
            console.log("yellow on");
            b.digitalWrite(yellowLED, b.HIGH);
        } else {
            console.log("yellow off");
            b.digitalWrite(yellowLED, b.LOW);
        }
    });
    
    socket.on('redRGB', function (data) {
        console.log("redRGB value is " + data.value);
        b.analogWrite(redRGB, (data.value/100));
    });
    socket.on('greenRGB', function (data) {
        console.log("greenRGB value is " + data.value);
        b.analogWrite(greenRGB, (data.value/100));
    });
    socket.on('blueRGB', function (data) {
        console.log("blueRGB value is " + data.value);
        b.analogWrite(blueRGB, (data.value/100));
    });

    socket.on('speechAction',function(data){
        console.log(data.speech);
        var speech = data.speech.toLowerCase();
        if(speech.search('yellow on') > -1){
            console.log('yellow on');
            b.digitalWrite(yellowLED, b.HIGH);
        }
        if(speech.search('yellow off') > -1){
            console.log('yellow off');
            b.digitalWrite(yellowLED, b.LOW);
        }

    });
    socket.on('orientationOn', function (data) {
       //console.log(" raw gamma " + data.gamma);
       //console.log("gamma = " + convertToRGB(data.gamma,0, 360));
       b.analogWrite(blueRGB,convertToRGB(data.gamma,0, 360));
       //console.log(" raw beta " + data.beta);
       //console.log("beta " + convertToRGB(data.beta,-90, 90));
       b.analogWrite(greenRGB,convertToRGB(data.beta,-90, 90));
       console.log(" raw alpha " + data.alpha);
       console.log("alpha " + convertToRGB(data.alpha,0, 360));
       b.analogWrite(redRGB,convertToRGB(data.alpha,0, 360));
    });
    
     socket.on('orientationOff', function (data) {
       b.analogWrite(blueRGB,0);
       b.analogWrite(greenRGB,0);
       b.analogWrite(redRGB,0);
    });

});
function convertToRGB(value, min, max) {
     return Math.abs((value - min) / (max-min));
}
function getTemp(x) {
    millivolts = x.value * 1800;
    temp_c = (millivolts - 500) / 10;
    temp_f = (temp_c * 9/5) + 32;
    console.log('fahrenheit: ' + temp_f);
    console.log('celcius: ' + temp_c);

}
console.log("Server listening on " + app.get('port'));

