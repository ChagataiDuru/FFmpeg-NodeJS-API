'use strict';
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const fs = require('fs');
const Busboy = require('busboy');
const ffmpeg = require('fluent-ffmpeg');

const server = new Hapi.Server({
    port: 8080,
    host: '0.0.0.0',
    routes: {
        payload: {
            output: 'stream',
            parse: false,
            allow: ['multipart/form-data', 'application/octet-stream', 'video/mp4', 'video/quicktime'],
            maxBytes: 52428800 // 50MB
        }
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply){
        return reply.file('public/index.html');
    }
});

server.route({
    method: 'POST',
    path: '/upload',
    handler: function (request, reply) {
        console.log('Uploading file');
        const busboy = Busboy({ headers: request.headers });
        const fileData = {};
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
            const saveTo = Path.join(__dirname, 'uploads', filename);
            file.pipe(fs.createWriteStream(saveTo));
            fileData.path = saveTo;
            fileData.type = mimetype;
            console.log('File saved to: ' + saveTo);
        });
        busboy.on('finish', function() {
            console.log('Done parsing form!');
            reply(JSON.stringify(fileData));
            const filePath = fileData.path;
            const fileType = fileData.type.split('/')[1];
            const fileName = Path.basename(filePath, Path.extname(filePath));
            const convertedFilePath = Path.join(__dirname, 'converted', `${fileName}.${fileType}`);
            ffmpeg(filePath)
                .toFormat(fileType)
                .on('end', function() {
                    console.log('File converted successfully');
                })
                .on('error', function(err) {
                    console.log('An error occurred: ' + err.message);
                })
                .save(convertedFilePath);
            console.log('File converted to: ' + convertedFilePath);
        });
        require('request')(request).pipe(busboy);
    },
});

server.route({
    method: 'GET',
    path: '/convert',
    handler: function (request, reply) {
        const filePath = request.query.path;
        const fileType = request.query.type;
        const fileName = Path.basename(filePath, Path.extname(filePath));
        const convertedFilePath = Path.join(__dirname, 'converted', `${fileName}.${fileType}`);
        reply.file(convertedFilePath, {
            confine: false,
            filename: `${fileName}.${fileType}`,
            mode: 'attachment'
        }).type(fileType);
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});

server.register([Inert.plugin, Vision.plugin]);
