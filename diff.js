var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var path = require('path');
var ftp = require('ftp');
var fs = require('fs');
var payloadParcer = require('./payload_parser');
var mandrill = require('mandrill-api/mandrill');

var binPath = phantomjs.path;
var captureFileName = 'capture.png';
var config = payloadParcer.parse(process.argv);

var childArgs = [
    path.join(__dirname, 'capture.js'),
    config.capture.url
]

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
            "html": "<p>Example HTML content</p><img src=cid:captureImg />",
            "text": "Example text content",
            "subject": "example subject",
            "from_email": "capture@7diff.com",
            "to": [{
                "email": "artraxus@gmail.com"
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

childProcess.execFile(binPath, childArgs, function (err, stdout, stderr) {
    if (err) throw err;
    upload(captureFileName, captureFileName);
    sendMail(captureFileName);
});