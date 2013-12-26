var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var path = require('path');
var ftp = require('ftp');
var payloadParcer = require('./payload_parser');
var binPath = phantomjs.path;
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

childProcess.execFile(binPath, childArgs, function (err, stdout, stderr) {
    if (err) throw err;
    upload('capture.png', 'capture.png');
});