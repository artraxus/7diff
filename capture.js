var page = require('webpage').create(),
    system = require('system'),
    address;

if (system.args.length != 2) {
    console.log('Usage: capture.js URL');
    phantom.exit(1);
} else {
    address = system.args[1];
    page.viewportSize = { width: 600, height: 600 };
    
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit();
        } else {
            window.setTimeout(function () {
                page.render('capture.png');
                phantom.exit();
            }, 200);
        }
    });
}