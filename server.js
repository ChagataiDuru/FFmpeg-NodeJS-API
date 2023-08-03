'use strict';
const Hapi = require('hapi');
const Path = require('path');
const fs = require('fs');
const Busboy = require('busboy');
const ffmpeg = require('fluent-ffmpeg');

const server = new Hapi.Server({
    port: 8080,
    host: 'localhost'
});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply.file('index.html');
    }
});

server.route({
    method: 'POST',
    path: '/upload',
    handler: function (request, reply) {
        const busboy = new Busboy({ headers: request.headers });
        const fileData = {};
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            const saveTo = Path.join(__dirname, 'uploads', filename);
            file.pipe(fs.createWriteStream(saveTo));
            fileData.path = saveTo;
            fileData.type = mimetype;
        });
        busboy.on('finish', function() {
            reply(JSON.stringify(fileData));
        });
        request.pipe(busboy);
    }
});

server.route({
    method: 'GET',
    path: '/convert',
    handler: function (request, reply) {
        const filePath = request.query.path;
        const fileType = request.query.type;
        const fileName = Path.basename(filePath, Path.extname(filePath));
        const convertedFilePath = Path.join(__dirname, 'converted', `${fileName}.${fileType}`);
        ffmpeg(filePath)
            .toFormat(fileType)
            .on('end', function() {
                reply.file(convertedFilePath, {
                    confine: false,
                    filename: `${fileName}.${fileType}`,
                    mode: 'attachment'
                }).type(fileType);
            })
            .on('error', function(err) {
                console.log('An error occurred: ' + err.message);
                reply(err);
            })
            .save(convertedFilePath);
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});