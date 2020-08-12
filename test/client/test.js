
const request = require('request-promise');
const expect = require('chai').expect;
const _ = require('lodash');
const moment = require('moment');
const common = require('./common');
const url = common.url;
const utils = require('../../common/utils');
const sleep = require('sleep-promise');
async function testRun(){
    let options = {
        qs: {
            vs: `abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef
            -abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef
            -abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef
            -abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef`,
            timestamp: moment().valueOf(),
        },
        json: true, simple: true, resolveWithFullResponse: true
    };
    // let uuu = `${url}/users/fun`;
    // let uuu = `${url}/fun1`;
    let uuu = `${url}/userfun`;
    return request.get(uuu,options)
        .then(function ({statusCode,body,headers,request}) {
            console.log('statusCode:',statusCode);
            console.log('body:',JSON.stringify(body,null,2));
            // expect(statusCode).to.equal(200);
        })
}

async function run(count) {
    for (let i=0; i<count; i++){
       await testRun();
       console.log(`run ${i+1} ok!`);
       // await sleep(10);
    }
    return 'run end';
}
// run(1).then(ret=>console.log(ret));
run(1000000).then(ret=>console.log(ret));