var fs = require('fs');
var q = require('q');

exports.firstCaptureMailMessage = function firstCaptureMailMessage(from, to, url, captureImg) {
    var defer = q.defer();

    fs.readFile(captureImg, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            var base64Img = new Buffer(data).toString('base64');

            var message = {
                "html": "<p>This is your first capture of " + url + "</p><img src=cid:captureImg /><p>Take another capture to see the diff</p>",
                //"text": "Example text content",
                "subject": "First capture of " + url,
                "from_email": from,
                "to": [{
                    "email": to
                }],
                "headers": {
                    "Reply-To": "clement.folliet@gmail.com"
                },
                "images": [{
                    "type": "image/png",
                    "name": "captureImg",
                    "content": base64Img
                }]
            };

            defer.resolve(message);
        }
    });

    return defer.promise;
};

exports.noDiffMailMessage = function noDiffMailMessage(from, to, url, captureImg) {
    var defer = q.defer();

    fs.readFile(captureImg, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            var base64Img = new Buffer(data).toString('base64');

            var message = {
                "html": "<p>There is no diff for the capture of " + url + "</p><img src=cid:captureImg />",
                //"text": "Example text content",
                "subject": "No diff of " + url,
                "from_email": from,
                "to": [{
                    "email": to
                }],
                "headers": {
                    "Reply-To": "clement.folliet@gmail.com"
                },
                "images": [{
                    "type": "image/png",
                    "name": "captureImg",
                    "content": base64Img
                }]
            };

            defer.resolve(message);
        }
    });

    return defer.promise;
};

exports.diffMailMessage = function diffMailMessage(from, to, url, diffImg) {
    var defer = q.defer();
    
    fs.readFile(diffImg, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            var base64DiffImg = new Buffer(data).toString('base64');

            var message = {
                "html": "<p>There is diff for the capture of " + url + "</p><img src=cid:diffImg />",
                //"text": "Example text content",
                "subject": "diff of " + url,
                "from_email": from,
                "to": [{
                    "email": to
                }],
                "headers": {
                    "Reply-To": "clement.folliet@gmail.com"
                },
                "images": [{
                    "type": "image/png",
                    "name": "diffImg",
                    "content": base64DiffImg
                }]
            };

            defer.resolve(message);
        }
    });

    return defer.promise;
};