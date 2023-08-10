'use strict';
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');
const Path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');

const server = new Hapi.Server({
    port: 8080,
    host: '0.0.0.0',
    routes: {
        payload: {
            output: 'stream',
            multipart: true,
            timeout: false,
            parse: true,
            allow: ['application/json', 'multipart/form-data', 'video/mp4', 'image/jpeg', 'application/pdf', 'application/x-www-form-urlencoded'],
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
        let data = request.payload;
        const filename = data.file.hapi.filename
        console.log(filename)
        fs.writeFile('./uploads/' + filename, data.file._data, err => {
            if (err) {
              console.error(err)
            }
            console.log('File saved')
        })
        ffmpeg('./uploads/' + filename)
        .toFormat(data.type)
        .on('error', function(err, stdout, stderr) {
            console.log('An error occurred: ' + err.message);
        }
        )
        .on('progress', function(progress) {
            console.log('Processing: ' + progress.percent + '% done');
        }
        )
        .on('end', function() {
            console.log('Processing finished !');
            console.log(`${filename.split('.')[0]}.${data.type}`)
        }
        )
        .save('./converted/' + `${filename.split('.')[0]}.${data.type}`)
        .pipe(reply.response(), { end: true });

        return reply.file('./converted/' + `${filename.split('.')[0]}.${data.type}`
        ).type(data.type)
        .header('Content-Disposition', `attachment; filename=${filename.split('.')[0]}.${data.type}`)
        .header('Content-Type', data.type == 'mp3' ? 'audio/mpeg' : 'video/mp4')
        .header('Content-Length', data.file._data.length);

    },
    config: {
        payload: {
            output: "stream",
            parse: true,
            allow: "multipart/form-data",
            multipart: { output: 'stream' },
            maxBytes: 50 * 1000 * 1000 //50MB
        },
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
