/**
 * Created by Administrator on 2018/3/4.
 */
const _ = require('lodash');
// const Seneca = require('seneca');
// const SenecaPromise = require('seneca-promise');
const KoaRouter = require('koa-router');
// const SenecaWeb = require('seneca-web');
const Framework = require('../../framework/framework');

const {generateRouteMaps} = require('../resource/url');
// const seneca_web_adapter = require('../../common/REST/web-adapter-koa2-rest');
const seneca_web_adapter = require('../../common/REST/seneca-web-adapter-koa2');

const hookAbilities = require('../ability/hookAbilities');


module.exports = function restRouter(resourceConfig, extendBusinesses, dbConfig,options) {
    options = _.extend({serverName:'ServerName',ip:'localhost',port:3000}, options);
    resourceConfig = resourceConfig || {};
    extendBusinesses = extendBusinesses || {};

    // 对resourceConfig数据结构进行格式化及缺省字段补齐， 如代码过多，将重构提取为函数
    {
        // 将membership资源转挂到两节点资源上
        let membershipNames = _.keys(resourceConfig).filter(name=>_.isArray(resourceConfig[name].memberships));
        _.forEach(membershipNames, mName=>{
            let [lName,rName] = resourceConfig[mName].memberships;
            resourceConfig[lName].memberships = _.concat(resourceConfig[lName].memberships||[], [mName,rName]);
            resourceConfig[rName].memberships = _.concat(resourceConfig[rName].memberships||[], [mName,lName]);
        });
        // 缺省参数
        _.keys(resourceConfig).map(name=>{
            resourceConfig[name].log = _.get(resourceConfig[name],"log",true);
        });
    }
    // 更多扩展能力插入 abilities
    {
        hookAbilities(resourceConfig, extendBusinesses);
    }

    return new Promise((resolve, reject) => {
        // 初始化 Seneca 消息框架
        // const seneca = Seneca({
        //     tag: options.serverName,
        //     timeout: 60 * 1000,
        //     log: 'silent',
        //     debug: {undead: true},
        //     fixedargs: {fatal: false},
        //     strict: { result: false},
        //     // history: { active: false},
        // });
        // seneca.fixedargs = {fatal$: false}; // fixedargs设置 使seneca抛出异常
        // seneca.use(SenecaPromise);
        // console.log(`[Seneca Start] --> id: ${seneca.id}, start_time : ${seneca.start_time} , tag : ${seneca.tag} , version : ${seneca.version}`);

        let framework = new Framework({
            timeout: 60*1000,
        });

        // 资源接口插件
        let resources = require('../../plugins/resource/resources');
        resources.call(framework,resourceConfig);
        // seneca.use('../../plugins/resource/resources', resourceConfig);
        // HTTP数据解析
        let parse = require('../../plugins/resource/parse');
        parse.call(framework,resourceConfig);
        // seneca.use('../../plugins/resource/parse', resourceConfig);
        // 返回格式规范定义
        let schema = require('../../plugins/resource/schema');
        schema.call(framework,{resourceConfig, ip: options.ip, port: options.port});
        // seneca.use('../../plugins/resource/schema', {resourceConfig, ip: options.ip, port: options.port});
        // 资源业务插件
        let business = require('../../plugins/business/business');
        business.call(framework,{
            resourceConfig,
            dbConfig: dbConfig,
            extendBusinesses: extendBusinesses
        });
        // seneca.use('../../plugins/business/business', {
        //     resourceConfig,
        //     dbConfig: dbConfig,
        //     extendBusinesses: extendBusinesses
        // });

        // HTTP URL --> Pattern
        let koa_router = options.router || KoaRouter();
        let web = require('../../framework/web/web');
        web.call(framework,{
            context: koa_router,
            adapter: seneca_web_adapter,
            routes: generateRouteMaps(resourceConfig)
        });
        // seneca.use(SenecaWeb, {
        //     context: koa_router,
        //     adapter: seneca_web_adapter,
        //     routes: generateRouteMaps(resourceConfig)
        // });
        // seneca.ready(() => {
        //     console.log(`[Seneca Start] --> Seneca start success!`);
        // });
        // return koa_router;

        // seneca.ready(() => {
        //     console.log(`[Seneca Start] --> Seneca start success!`);
        //     resolve(koa_router);
        // });

        console.log(`[Framework] --> framework start success!`);
        resolve(koa_router);

    });
};