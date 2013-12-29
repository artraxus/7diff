var uuid = require('node-uuid');

exports.User = function User(data) {
    this.email = null;
    this.pages = [];

    if (data) {
        this.email = data.email;
        this.pages = data.pages.map(function (data) {
            return new exports.Page(data);
        });
    }

    this.getPage = function (url) {
        var result = null;
        this.pages.every(function (page) {
            if (page.url == url) {
                result = page;
                return false;
            }
            return true;
        });
        return result;
    };
};

exports.Page = function Page(data) {
    this.url = null;
    this.captures = [];

    if (data) {
        this.url = data.url
        this.captures = data.captures.map(function (data) {
            return new exports.Capture(data);
        });
    }

    this.getRef = function () {
        var result = null;
        this.captures.forEach(function (capture) {
            if (capture.isRef) {
                result = capture;
                return true;
            }
            return true;
        });
        return result;
    };
};

exports.Capture = function Capture(data) {
    this.fileId = uuid.v4();
    this.timestamp = new Date().getTime();
    this.isRef = false;

    if (data) {
        this.fileId = data.fileId;
        this.timestamp = data.timestamp;
        this.isRef = data.isRef;
    }
};