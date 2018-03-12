/**
 * Created by Administrator on 2018/3/4.
 */
const _ = require('lodash');
const Seneca = require('seneca');
const SenecaPromise = require('seneca-promise');
const KoaRouter = require('koa-router');
const SenecaWeb = require('seneca-web');

const {generateRouteMaps} = require('../resource/url');
const seneca_web_adapter = require('../../common/REST/seneca-web-adapter-koa2-rest');

module.exports = function restRouter(resourceConfig, extendBusinesses, dbConfig,options) {
    options = _.extend({serverName:'ServerName',ip:'localhost',port:3000}, options);
    resourceConfig = resourceConfig || {};
    extendBusinesses = extendBusinesses || {};

    return new Promise((resolve, reject) => {

        const seneca = Seneca({
            tag: options.serverName,
            timeout: 60 * 1000,
            log: 'silent',
            debug: {undead: true},
            fixedargs: {fatal: false}
        });
        seneca.fixedargs = {fatal$: false}; // fixedargs设置 使seneca抛出异常
        seneca.use(SenecaPromise);
        console.log(`[Seneca Start] --> id: ${seneca.id}, start_time : ${seneca.start_time} , tag : ${seneca.tag} , version : ${seneca.version}`);

        // 资源接口插件
        seneca.use('../../plugins/resource/resources', resourceConfig);
        // HTTP数据解析
        seneca.use('../../plugins/resource/parse', resourceConfig);
        // 返回格式规范定义
        seneca.use('../../plugins/resource/schema', {resourceConfig, ip: options.ip, port: options.port});
        // 资源业务插件
        seneca.use('../../plugins/business/business', {
            resourceConfig,
            dbConfig: dbConfig,
            extendBusinesses: extendBusinesses
        });

        // HTTP URL --> Pattern
        let koa_router = options.router || KoaRouter();
        seneca.use(SenecaWeb, {
            context: koa_router,
            adapter: seneca_web_adapter,
            routes: generateRouteMaps(resourceConfig)
        });
        // seneca.ready(() => {
        //     console.log(`[Seneca Start] --> Seneca start success!`);
        // });
        // return koa_router;

        seneca.ready(() => {
            console.log(`[Seneca Start] --> Seneca start success!`);
            resolve(koa_router);
        });
    });
};