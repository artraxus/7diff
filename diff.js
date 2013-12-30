var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var path = require('path');
var ftp = require('ftp');
var fs = require('fs');
var payloadParcer = require('./payload_parser');
var model = require('./model');
var pngDiff = require('png-diff');
var q = require('q');
var mandrill = require('mandrill-api/mandrill');
var uuid = require('node-uuid');

var binPath = phantomjs.path;
var captureScript = 'capture.js';
var captureFileName = 'capture.png';
var captureRefFileName = 'ref.png';
var captureDiffFileName = 'diff.png';
var ftpFileDelimiter = '__';
var config = payloadParcer.parse(process.argv);
var ironio = require('node-ironio')(config.iron.token);
var ironProject = ironio.projects(config.iron.project_id);
var cache = ironProject.caches(config.cache.name);

var ftpConfig = {
    host: config.ftp.host,
    user: config.ftp.user,
    password: config.ftp.password
};
var ftpWorkingDirectory = '7diff';

var upload = function (fileSource, filename) {
    var defer = q.defer();
    var ftpClient = new ftp();

    ftpClient.on('ready', function () {
        ftpClient.cwd(ftpWorkingDirectory, function (err) {
            if (err) {
                defer.reject(err);
            }
            else {
                ftpClient.put(fileSource, filename, function (err) {
                    if (err) { defer.reject(err); }
                    else {
                        ftpClient.end();
                        defer.resolve();
                    }
                });
            }
        });
    });

    ftpClient.connect(ftpConfig);
    return defer.promise;
}

var download = function (fileSource, filename) {
    var defer = q.defer();
    var ftpClient = new ftp();

    ftpClient.on('ready', function () {
        ftpClient.cwd(ftpWorkingDirectory, function (err) {
            if (err) {
                defer.reject(err);
            }
            else {
                ftpClient.get(fileSource, function (err, stream) {
                    if (err) {
                        defer.reject(err);
                    }
                    else {
                        stream.once('close', function () {
                            ftpClient.end();
                            console.log('22'); defer.resolve();
                        });
                        stream.pipe(fs.createWriteStream(filename));
                    }
                });
            }
        });
    });

    ftpClient.connect(ftpConfig);
    return defer.promise;
};

var sendMail = function (captureImg) {
    var mandrillClient = new mandrill.Mandrill(config.mail.api_key);

    fs.readFile(captureImg, function (err, data) {
        var base64Img = new Buffer(data).toString('base64');

        var message = {
            "html": "<p>Current website screen capture</p><img src=cid:captureImg />",
            "text": "Example text content",
            "subject": "example subject",
            "from_email": "capture@7diff.com",
            "to": [{
                "email": config.user
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

        mandrillClient.messages.send({ "message": message }, function (result) {
            console.log("messages.send result: " + result[0].email + " " + result[0].status + " " + result[0].reject_reason);
        }, function (e) {
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        });
    });
};

var getUserCache = function (userEmail) {
    var defer = q.defer();

    cache.get(encodeURIComponent(userEmail), function (err, user) {
        if (err) defer.reject(err);
        else {
            if (user) {
                defer.resolve(new model.User(JSON.parse(user)));
            }
            else {
                defer.resolve(null);
            }
        }
    });

    return defer.promise;
}

var setUserCache = function (user) {
    var defer = q.defer();
    cache.put(encodeURIComponent(user.email), JSON.stringify(user), function (err) {
        if (err) defer.reject(err);
        else defer.resolve();
    });
    return defer.promise;
};

var takeCapture = function (url, outputFilename) {
    var defer = q.defer();
    var childArgs = [
        path.join(__dirname, captureScript),
        url,
        outputFilename
    ];

    childProcess.execFile(binPath, childArgs, function (err, stdout, stderr) {
        if (err) defer.reject(err);
        else defer.resolve()
    });

    return defer.promise;
};

var compareImages = function () {
    pngDiff.outputDiff(captureFileName, captureRefFileName, captureDiffFileName, function (err) {
        if (err) throw err;
        // highlights the difference in red
        console.log('Diff saved!');
    });
};

function run() {

    var capture = new model.Capture(null);
    var url = config.capture.url;

    var capturePromise = takeCapture(url, captureFileName);
    var downloadPromise = null;
    var hasRefCapture = false;

    console.log('1');

    capturePromise.then(function () {
        console.log('21');
        return upload(captureFileName, capture.fileId + '.png');
    }).done();

    var xx = getUserCache(config.user).then(function (user) {
        var defer = q.defer();
        var downloadPromise = null;

        if (!user) {
            user = new model.User();
            user.email = config.user
        }

        var page = user.getPage(url);
        if (page) {
            var refCapture = page.getRef();
            if (refCapture) {
                hasRefCapture = true;
                downloadPromise = download(refCapture.fileId + '.png', captureRefFileName);
            }
        }
        else {
            page = new model.Page();
            page.url = config.capture.url
            user.pages.push(page);
            capture.isRef = true;
        }

        page.captures.push(capture);

        q.all([setUserCache(user), downloadPromise]).done(defer.resolve);

        return defer.promise;
    });

    q.all([capturePromise, xx]).done(function () {
        if (hasRefCapture) {
            compareImages();
        }
    });

    //sendMail(captureFileName);

}

run();