/**
 * A lib to fix Halifax CSV
 *
 * http://loose-bits.com/2012/08/02/nodejs-read-write-streams-pipes.html
 * 
 * 27/03/2015,DEB,'11-04-14,10627761,"BOOTS,LONDON" CD 0218 ,7.63,,5646.07
 *
 */

var fs = require('fs');
var util = require('util');

module.exports = HalifaxStream;

/* -------------------------------------------------------- */
/**
 * A simple Halifax stream converter.
 */
function HalifaxStream() {
  this.readable = true;
  this.writable = true;
};

util.inherits(HalifaxStream, require('stream'));

/**
 * Handle various params and upper-case string data.
 *
 * Signature can be in format of:
 *  - string, [encoding]
 *  - buffer
 *
 * Our example implementation hacks the data into a simpler
 # (string) form -- real implementations would need more.
 */
HalifaxStream.prototype._transform = function (data) {
  // Here, we'll just shortcut to a string.
  data = data ? data.toString() : "";

  // Remove uneed data from the string and emit a valid CSV data event with transformed data.
  this.emit("data", data.replace(/ CD 0218 /gi, ""));
};

/**
 * Stream write (override).
 */
HalifaxStream.prototype.write = function () {
  this._transform.apply(this, arguments);
};

/**
 * Stream end (override).
 */
HalifaxStream.prototype.end = function () {
  this._transform.apply(this, arguments);
  this.emit("end");
};

/* -------------------------------------------------------- */
