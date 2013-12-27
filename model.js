var uuid = require('node-uuid');

exports.User = function User(email) {
    this.email = email;
    this.pages = [];
};

exports.Page = function Page(url) {
    this.url = url;
    this.captures = [];
};

exports.Capture = function Capture(fileId, timestamp, isRef) {
    this.fileId = fileId || uuid.v4();
    this.timestamp = timestamp || new Date().getTime();
    this.isRef = isRef || false;
};