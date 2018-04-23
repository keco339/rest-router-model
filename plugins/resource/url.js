/**
 * Created by Administrator on 2018/1/15.
 */
const _ = require('lodash');
const jsonic = require('jsonic');

const inflection = require( 'inflection' );
const Path = require('path');
const Url = require('url');
const REST = require('../../common/REST/restApi');


/**
 * seneca-web插件 HTTP URL 路由映射规则，请详见以下链接：
 *  ==>  https://github.com/senecajs/seneca-web/blob/master/docs/providing-routes.md
 *  URL：  /${prefix}/${key}/${postfix}/${suffix}
 *  REST 路由映射规则实例：
 *  {
 *      pin: jsonic.stringify({resource: 'user', action: '*'}),
 *      prefix: '/api/:version/users/
 *      postfix: '',
 *      map: {
 *          // 'create','get','update','list','delete'  'batchCreate','batchGet','batchUpdate','batchDelete'
 *          batchCreate: {POST: true, name: '',suffix: '/batchCreate'},
 *          batchGet: {GET: true, POST:true, name: '',suffix: '/batchGet'},
 *          batchUpdate: {POST: true, name: '',suffix: '/batchUpdate'},
 *          listAll: {GET: true, name: '',suffix: '/listAll'},
 *          batchDelete: {DELETE: true, name: '',suffix: '/batchDelete'},
 *          // 注意：自定义动作在前，REST标准接口在后，否则 /:uuid 会优先匹配。
 *          create: {POST: true, name: ''},
 *          list: {GET: true, name: ''},
 *          get: {GET: true, name: '', suffix: '/:uuid'},
 *          update: {PUT: true, POST:true, name: '', suffix: '/:uuid'},
 *          delete: {DELETE: true, name: '', suffix: '/:uuid'},
 *          sexsat: {POST: true,}
 *      }
 *  }
 */


let RESTBaseMap = {
    // 'create','get','update','list','delete'
    create: {POST: true, name: ''},
    list: {GET: true, name: ''},
    get: {GET: true, name: '', suffix: '/:uuid'},
    update: {PUT: true, POST:true, name: '', suffix: '/:uuid'},
    delete: {DELETE: true, name: '', suffix: '/:uuid'},
};
let RESTBatchMap = {
    // 'batchCreate','batchGet','batchUpdate','batchDelete'
    batchCreate: {POST: true, name: '',suffix: '/batchCreate'},
    batchGet: {GET: true, name: '',suffix: '/batchGet'},
    batchUpdate: {PUT: true,POST: true, name: '',suffix: '/batchUpdate'},
    listAll: {GET: true, name: '',suffix: '/listAll'},
    batchDelete: {DELETE: true, name: '',suffix: '/batchDelete'},
};
let RESTMap = _.assign({},RESTBatchMap,RESTBaseMap);


function buildPath (route) {
    let path = null;
    if (route.alias) {
        path = Path.join('/', route.alias)
    }
    else {
        const prefix = route.prefix || '';
        const part = route.part || '';
        const postfix = route.postfix || '';
        const suffix = route.suffix || '';
        path = Path.join('/', prefix, part, postfix, suffix);
    }
    return Url.parse(path).path
}
function isValidMethod (method) {
    method = method || '';
    method = method.toString();
    method = method.toUpperCase();
    const methods = ['GET', 'POST', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'PATCH'];
    return _.includes(methods, method);
}
function getHTTPMethod(obj) {
    return _.keys(obj).filter(key=>isValidMethod(key));
}

// 扩展接口描述 ==> URL map
function extendApiMap(extend_api) {
    let extendMap={};
    (extend_api || []).filter(extend=>!extend.url).map(extend=>{
        // [{name:'test',type:'object',method:'POST,GET'}]
        extendMap[extend.name] = {name: '',suffix: `/${extend.name}`};
        extendMap[extend.name].suffix = (extend.type && extend.type == 'object') ? `/:uuid/${extend.name}` : `/${extend.name}`;
        _.split(extend.method,',')
            .map(method=>_.trim(method).toUpperCase())
            .map(method=>{extendMap[extend.name][method]=true;});
    });
    return extendMap;
}
function extendAliasApiMap(extend_api) {
    let extendMap={};
    (extend_api || []).filter(extend=>extend.url).map(extend=>{
        extendMap[extend.name] = {name: '',suffix: `/${extend.name}`};
        extendMap[extend.name].alias = extend.url;
        extendMap[extend.name].suffix = (extend.type && extend.type == 'object') ? `/:uuid/${extend.name}` : `/${extend.name}`;
        _.split(extend.method,',')
            .map(method=>_.trim(method).toUpperCase())
            .map(method=>{extendMap[extend.name][method]=true;});
    });
    return extendMap;
}

function getAllUriPrefixs(resourceConfig, name) {
    let prefixs = [];

    let pluralizeName = inflection.pluralize(name);
    let path  = `/api/:version/${pluralizeName}`;
    prefixs.push(path);

    let superName = resourceConfig[name].super;
    let fix = pluralizeName;
    while ( superName && resourceConfig[superName] ){
        fix = Path.join('/',inflection.pluralize(superName),`:${inflection.singularize(superName)}UUID`, fix);
        let path = Path.join('/', '/api/:version/',fix);
        path = Url.parse(path).path;
        prefixs.push(path);
        superName = resourceConfig[superName].super;
    }
    return prefixs;

}

function logUriMap(name, action, map, uri) {
    let str1 = `{resource:${name} action:${action}}`;
    let n = str1.length;
    let padN = n <= 35 ? 35 : (n <= 45 ? 45 : (n <= 55 ? 55 : 60));
    console.log(`[REST URI Map] --> ${_.padEnd(str1, padN, ' ')} URI: ${_.padEnd(getHTTPMethod(map[action]), 8, ' ')}  ${uri}`)
}

function generateRouteMaps(resourceConfig) {
    // 获取所有资源名
    let resourceNames = _.keys(resourceConfig);
    // 生成资源 创建、更新、获取、列表、删除 路由映射规则
    let routeMaps = _.flatMap(resourceNames, name => {
        // 生成所有的接口map, 注意：自定义接口需放在前面
        let apiType = resourceConfig[name].rest_api || 'base';
        let baseMap = apiType=='base'?RESTBaseMap:(apiType=='batch'?RESTMap:{});
        let extendMap = extendApiMap(resourceConfig[name].extend_api);
        let map = _.assign({},extendMap,baseMap);
        // 生成获取资源URL前缀
        let prefixs = getAllUriPrefixs(resourceConfig, name);
        let rm = prefixs.map(prefix=>{
            {
                // 打印URI路径信息
                _.keys(map).forEach(action => {
                    let route = {
                        alias: map[action].alias,
                        prefix: prefix,
                        part: map[action].name,
                        postfix: null,
                        suffix: map[action].suffix
                    };
                    let uri = route.alias || buildPath(route);
                    logUriMap(name, action, map, uri);
                });
            }
            return {pin: jsonic.stringify({resource: name, type:'api',action: '*'}), prefix, map };
        });
        {
            let map2 = extendAliasApiMap(resourceConfig[name].extend_api);
            // 打印URI路径信息
            _.keys(map2).forEach(action =>logUriMap(name, action, map2, map2[action].alias));
            if(!_.isEmpty(map2)){
                rm.push({pin: jsonic.stringify({resource: name, type:'api',action: '*'}), map:map2});
            }
        }
        return rm;
    });
    // 生成在上上级资源下 列表下属资源
    let hasUpSuperResourceNames = resourceNames.filter(name => (resourceConfig[name].super && resourceConfig[resourceConfig[name].super].super));
    let upSuperMaps = hasUpSuperResourceNames.map(name => {
        let pName = inflection.pluralize(name);
        let upSuperName = resourceConfig[resourceConfig[name].super].super;
        let pUpSuperName = inflection.pluralize(upSuperName);
        let uri = `/api/:version/${pUpSuperName}/:${upSuperName}UUID/${pName}`;
        let map = {list: {GET: true, name: ''}};
        let action = 'list';
        // console.log(`[REST URI Map] --> {${_.padEnd(`resource:${name} action:${action}}`,35,' ')} URI: ${_.padEnd(getHTTPMethod(map[action]),8,' ')}  ${uri}`);
        logUriMap(name, action, map, uri);
        return {pin: jsonic.stringify({resource: name, type: 'api', action: '*'}), prefix: uri, map};

    });
    // 生成关系型资源 路由映射规则
    let membershipNames = resourceNames.filter(name=> (resourceConfig[name].type || '').toLowerCase() == 'membership');
    let membershipRouteMaps = _.flatMap(membershipNames, mName=>{
        let [lName,rName] = resourceConfig[mName].memberships;
        let mPName = inflection.pluralize(mName);

        return _.flatMap([[lName,rName],[rName,lName]],([lName,rName])=>{
            let rPName = inflection.pluralize(rName);
            return [lName,mName].map(name=>{
                let pName = inflection.pluralize(name);
                let uri = `/api/:version/${rPName}/:${rName}UUID/${pName}`;
                let map = { list: {GET: true, name: ''}};
                let action = 'list';
                // console.log(`[REST URI Map] --> {${_.padEnd(`resource:${name} action:${action}}`,35,' ')} URI: ${_.padEnd(getHTTPMethod(map[action]),8,' ')}  ${uri}`);

                logUriMap(name, action, map, uri);
                return {pin: jsonic.stringify({resource: name, type:'api',action: '*'}), prefix: uri, map };
            });
        });
    });

    // 为关系容器增加add,remove
    let membershipContainerNames = resourceNames.filter(name => (resourceConfig[name].type || '').toLowerCase() == 'membershipContainer');
    let membershipContainerRouteMaps = membershipContainerNames.map(name => {
        let pName = inflection.pluralize(name);
        let uri = `/api/:version/${pUpSuperName}/:${upSuperName}UUID/${pName}`;
        let map = {
            list: {GET: true, name: ''}
        };
        let action = 'list';
        logUriMap(name, action, map, uri);


        return {pin: jsonic.stringify({resource: name, type: 'api', action: '*'}), prefix: uri, map};
    });

    return [...routeMaps, ...membershipRouteMaps, ...upSuperMaps];
}

module.exports = {
    generateRouteMaps
};

// const resourceConfig = require('../../test/server/resourceConfig');
// let map = generateRouteMaps(resourceConfig);
// console.log(JSON.stringify(map,null,2));