'use strict';
const Hapi = require('hapi');
const ffmpeg = require('fluent-ffmpeg');

const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8080
});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply.file('myfile.mp3', {
            confine: false,
            filename: 'myfile.mp3',
            mode: 'attachment',
            path: 'https://dl.dropbox.com/s/pc7qp4wrf46t9op/test-clip.webm?dl=0'
        }).type('audio/mp3');
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});