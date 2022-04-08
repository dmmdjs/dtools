// @ts-check

"use strict";

// Imports
const { Log } = require("../index.js");

// Variables
let log = new Log("logs/latest.log");
let logOptions = { write: false };

// Tests
log.log({
    dateTime: 69420,
    dateTimeAlignment: "RIGHT",
    dateTimeMinimumWidth: 50,
    dateTimePadding: "#",
    dateTimeStyling: 42
}, logOptions);
log.log({
    message: "HELLO WORLD",
    messageStyling: [ [ 38, 5, 125 ] ],
    titleAlignment: "RIGHT",
    titleStyling: [ 1, [ 48, 2, 255, 127, 0 ] ]
}, logOptions);
log.format = () => "hello\n";
log.log({}, logOptions);
console.log(log.options);