
//var fs = require('fs');
const config = require('../server/config/config');
// const request = require('commonutils').request.request;

let options = {
    host: config.server.domain,
    port: config.server.port,
    path: '/',
    // auth : 'mGldhwkSw8MtDFLhbk1i4Q:mGldhwkSw8MtDFLhbk1i4Q',
    //key: fs.readFileSync(__dirname+'/clientSSLkey/client-key.pem'),
    //cert: fs.readFileSync(__dirname+'/clientSSLkey/client-cert.pem'),
    rejectUnauthorized:false,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
    }
};
exports.url = `http://${options.host}:${options.port}/api/v1`;

// exports.request = request;

