var oc = console;
var console = require("clim")();
var argv = require('optimist').argv;

var file = argv._;

console.log("Parsing from " + file);

var json = require(__dirname + '/' + file);

// Check the JSON is what we expect.
if (!("traceEvents" in json)) {
  throw "Missing the traceEvents keys";
}

var events = json["traceEvents"];
console.log('Found ' + events.length + " events");

// Filter for "TapGestures" events and "ScheduledTasks::finishing" events

function isStartEvent(event) {
  if ("args" in event) {
    if ("event" in event["args"]) {
      return event["args"]["event"] == "GestureTap";
    }
  }

  if ("name" in event) {
    if (event["name"] === "ScheduledAction::execute") return true;
  }
  return false;
}

function isEndEvent(event) {
  if (!("name" in event)) return false;
  if (event["name"] !== "ScheduledTasks") return false;

  if (!("args" in event)) return false;

  var args = event["args"];

  if (!("step" in args)) return false;

  if (!("state" in args)) return false;
  //if (!("completed_count" in args["state"])) return false;

  //if (args["state"]["completed_count"] < 2) return false;

  return event["args"]["step"] == "finishing";
}

var importantEvents = events.filter(function(event) {
  return (isStartEvent(event) || isEndEvent(event));
});

console.log("Found important events " + importantEvents.length);

var frameTimes = [];

var lastStart = -1;
var lastTime;
importantEvents.sort(function(a, b) {
  return a["ts"] - b["ts"];
}).forEach(function(event) {
  if (isStartEvent(event)) {
    cleanup();
    lastStart = event["ts"];
  }
  if (isEndEvent(event)) {
    if (lastStart === -1) {
      return; // ignore finish events that come before start events.
    }
    lastTime = event["ts"] - lastStart;
  }
});
cleanup();


function cleanup() {
  if (lastTime) {
    frameTimes.push(lastTime);
    console.log('Frame:', lastTime / 1000, 'ms');
    lastTime = undefined;
  }
}

var fs = require('q-fs');

fs.write(file + ".times.csv", frameTimes.join('\n')).done();
