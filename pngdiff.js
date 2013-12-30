var fs = require('fs');
var png = require('pngjs').PNG;

function _loadImage(path, done) {
    var stream = fs.createReadStream(path)
    stream.on('error', done);
    stream.pipe(new png()).on('parsed', function () {
        // `pack` is png's method for outputting the diff png
        done(null, this.data, this.width, this.height);
    });
}

function _loadImages(imagePath1, imagePath2, done) {
    _loadImage(imagePath1, function (err, data1, width1, height1) {
        if (err) return done(err);

        _loadImage(imagePath2, function (err, data2, width2, height2) {
            if (err) return done(err);

            done(null, data1, data2, width1, height1, width2, height2);
        });
    });
}

function _validateDataForComparison(data1, data2) {
    if (!data1.length || !data2.length) return 'Empty image data.';
    //if (data1.length !== data2.length) return 'Images not the same dimension.';
}

function outputDiff(imagePath1, imagePath2, outputPath, done) {
    _loadImages(imagePath1, imagePath2, function (err, data1, data2, width1, height1, width2, height2) {
        if (err) return done(err, null);

        var errMessage = _validateDataForComparison(data1, data2);
        if (errMessage) return done(errMessage);

        var maxHeight = Math.max(height1, height2);
        var diff = new png({ width: width1, height: maxHeight });
        var hasDiff = false;

        // chunk of 4 values: r g b a
        for (var y = 0; y < diff.height; y++) {
            for (var x = 0; x < diff.width; x++) {
                var i = (diff.width * y + x) << 2;
                
                if (data1[i] !== data2[i] || data1[i + 1] !== data2[i + 1] || data1[i + 2] !== data2[i + 2] || data1[i + 3] !== data2[i + 3]) {
                    hasDiff = true;
                    diff.data[i] = 255;
                    diff.data[i + 1] = 0;
                    diff.data[i + 2] = 0;
                    diff.data[i + 3] = 255;
                } else {

                    diff.data[i] = data1[i];
                    diff.data[i + 1] = data1[i + 1];
                    diff.data[i + 2] = data1[i + 2];
                    diff.data[i + 3] = data1[i + 3] / 2;
                }
            }
        }

        if (hasDiff) {
            diff.pack().pipe(fs.createWriteStream(outputPath));
        }

        done(null, hasDiff);
    });
}

module.exports = {
    outputDiff: outputDiff
};
