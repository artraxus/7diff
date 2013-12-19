var page = require('webpage').create(),
    system = require('system'),
    address;

    address = system.args[1];
    
    page.viewportSize = { width: 600, height: 600 };
    
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit();
        } else {
            window.setTimeout(function () {
                var base64image = page.renderBase64("PNG");
                system.stdout.write(base64image);
                phantom.exit();
            }, 1000);
        }
    });