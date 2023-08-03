'use strict';
var express = require('express');
var cors = require('cors')
var ffmpeg = require('fluent-ffmpeg');
var PORT = 8080;
var HOST = '0.0.0.0';
const app = express();
app.use(cors());
app.get('/', (req, res) => {
    res.contentType('audio/mp3');
    res.attachment('myfile.mp3');
    var pathToAudio = 'https://dl.dropbox.com/s/pc7qp4wrf46t9op/test-clip.webm?dl=0';
    ffmpeg(pathToAudio)
        .toFormat('mp3')
        .on('end', function(err) {
            console.log('done!')
        })
        .on('error', function(err) {
            console.log('an error happened: ' + err.message);
        })
        .pipe(res, {end: true})
});
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);