var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var path = require('path');
var ftp = require('ftp');
var fs = require('fs');
var payloadParcer = require('./payload_parser');
var model = require('./model');

var mandrill = require('mandrill-api/mandrill');
var uuid = require('node-uuid');

var binPath = phantomjs.path;
var captureScript = 'capture.js';
var captureFileName = 'capture.png';
var ftpFileDelimiter = '__';
var config = payloadParcer.parse(process.argv);
var ironio = require('node-ironio')(config.iron.token);
var ironProject = ironio.projects(config.iron.project_id);
var cache = ironProject.caches(config.cache.name);

var upload = function (fileSource, filename) {

    var ftpClient = new ftp();

    ftpClient.on('ready', function () {
        ftpClient.cwd('7diff', function (err) {
            if (err) throw err;
        });

        ftpClient.put(fileSource, filename, function (err) {
            if (err) throw err;
            ftpClient.end();
        });
    });

    var ftpConfig = {
        host: config.ftp.host,
        user: config.ftp.user,
        password: config.ftp.password
    };

    ftpClient.connect(ftpConfig);
}

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

var getUserCache = function (userEmail, cb) {
    cache.get(encodeURIComponent(userEmail), function (err, user) {
        if (err) throw err;
        cb(JSON.parse(user));
    });
}

var setUserCache = function (user) {
    cache.put(encodeURIComponent(user.email), JSON.stringify(user), function (err) {
        if (err) throw err;
    });
};

var setCapture = function (capture) {
    getUserCache(config.user, function (user) {
        console.log(JSON.stringify(user));
        if (!user) {
            user = new model.User(config.user);
        }

        var page = user.pages[capture.url];
        if (!page) {
            page = new model.Page(config.capture.url);
            capture.isRef = true;
        }

        page.captures.push(capture);
        user.pages.push(page);

        setUserCache(user);
    });    
};

var takeCapture = function (url, outputFilename, cb) {
    var childArgs = [
        path.join(__dirname, captureScript),
        url,
        outputFilename
    ];

    childProcess.execFile(binPath, childArgs, function (err, stdout, stderr) {
        if (err) throw err;
        cb();
    });
};

function run() {

    var capture = new model.Capture();

    takeCapture(config.capture.url, captureFileName, function () {
        upload(captureFileName, capture.fileId + '.png');
    });


    //takeCapture()
    //      upload()
    //getRefCapture()
    //
    //CompareCapture()
    //
    //SendEmail()



    //upload(captureFileName, capture.fileId + '.png');   
    //setCapture(capture);
    //sendMail(captureFileName);

}

run();