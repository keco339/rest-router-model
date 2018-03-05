"use strict";
const fs = require('fs');
//初始log4js
// require('commonutils');
let config = {
    //服务器配置
    server: {
        domain : '192.168.7.5',
        //domain: 'platform.icarcloud.net',
        port : 3000,
    },
    //debug 为true时，用于本地调试
    debug : false,
    //接口统计开关
    record : false,
    // knex配置
    knex: {
        client: 'mysql',
        connection: {
            host : '192.168.7.5',
            user : 'root',
            password : '123456',
            database : 'MicroServiceFrameDB',
            port : 3306
        },
        pool : {
            min : 0,
            max : 10
        },
    },
    isSendSMS: true,
    //JWT
    // jwt: {
    //     secret: '123456',
    //     public_key : fs.readFileSync(__dirname + '/../ssl/jwt_rsa/jwt_rsa_public_key.pem')
    // },
    signKey: 'eyJ1c2VyIjp7ImhyZWYiOiJodHRwOi8vMTkyLjE2OC43LjIwMjo1MDAzL2FwaS',
    //kafka
    kafka: {
        zkConnInfo: '192.168.7.166:2181',
        // host: '192.168.7.166',  // 192.168.7.166:2181, 192.168.7.167:2181, 192.168.7.168:2181
        // port: '2181'
    },
    //redis配置
    redis: {
        host : '192.168.7.210',
        port : 6379,
        db : 0,
        password : ''
    },

    ThirdServerByCommonConfig: [],
    cache : {
        // 缓存开关控制
        open : false,
        // 缓存失效时间,单位ms
        time : 1000,
    }
};

// 从全局上层CommonConfig中读取环境变量
try {
    const commonConfig = require('../../CommonConfig/serverConfig');
    let {server_domain=null,ThirdServer_domain=null,knex_connection=null,redis=null,kafkaConfig=null}=commonConfig;

    if(server_domain){config.server.domain = server_domain;}
    if(ThirdServer_domain && config.ThirdServerByCommonConfig){
        config.ThirdServerByCommonConfig.map( key=>{
            config[key].host=ThirdServer_domain;
        } );
    }
    if( knex_connection && config.knex.connection ){
        Object.keys(knex_connection).map(key=>{
            config.knex.connection[key] = knex_connection[key];
        });
    }
    if (redis && config.redis){
        Object.keys(redis).map(key=>{
            config.redis[key] = redis[key];
        });
    }
    if ( kafkaConfig && config.kafka ){
        Object.keys(kafkaConfig).map(key=>{
            config.kafka[key] = kafkaConfig[key];
        });
    }
    console.log('The read common config.');
}
catch(e) {
    console.warn('The common config does not exist!!!');
}



//从环境变量中覆盖配置参数，及默认优先使用环境变量参数
function readEnvParams( obj , prefix = null) {
    prefix = prefix ? prefix+'_' :'';
    Object.keys( obj ).map( key =>{
        let param = prefix+key;
        if( typeof obj[key] == 'object' ){
            readEnvParams( obj[key], param )
        }
        else {
            if( process.env[param] ){
                obj[key] = process.env[param];
            }
        }
    });
}
readEnvParams(config);

module.exports = config;