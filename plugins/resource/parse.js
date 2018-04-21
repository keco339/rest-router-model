/**
 * Created by Administrator on 2018/1/26.
 */
const _ = require('lodash');
const moment = require('moment');
const utils = require('../../common/utils');

function createParse(resourceConfig, resource, data, params) {
    let retData={};
    // 提取字段
    let restParams = resourceConfig[resource].params || {};
    let restParamKeys = _.keys(restParams);
    let defaultValueKeys = restParamKeys.filter(key => _.has(restParams[key], 'value'));
    // let jsonKeys =  _.keys(restParams).filter(key=>_.toLower(restParams[key].type)=='json');
    let hrefKeys = restParamKeys.filter(key => _.toLower(restParams[key].type) == 'url');
    // 添加uuid, 优先使用自定义
    if (!data.uuid) {
        retData.uuid = utils.createUUID();
    }
    // 设置默认值
    _.without(restParamKeys,...hrefKeys).forEach(key => {
        if (key == 'id') { return true; }
        let {type = 'string', value = null} = restParams[key];
        retData[key] = value || (_.toLower(type) == 'number' ? 0 : (_.toLower(type) == 'json' ? {} : null));
    });
    // 复制基础类型数据
    retData = _.assign(retData, data);
    // 复制转换Href
    hrefKeys.forEach(key => {
        let isPickUUID = _.has(restParams[key], 'isPickUUID') ? restParams[key].isPickUUID : true;
        if (isPickUUID) {
            retData[`${key}UUID`] = utils.getLastResourceUUIDInURL(data[`${key}Href`]);
        }
        let isSaveHref = _.has(restParams[key], 'isSaveHref') ? restParams[key].isSaveHref : true;
        if (isSaveHref) {
            retData[`${key}Href`] = data[`${key}Href`];
        }
        else {
            delete retData[`${key}Href`];
        }
    });
    // 挂接上级资源UUID
    let superName = resourceConfig[resource].super;
    if (superName && !_.isEmpty(_.trim(superName))) {
        if (params[`${superName}UUID`]) {
            retData[`${superName}UUID`] = params[`${superName}UUID`];
        }
        else if (retData[`${superName}Href`]) {
            retData[`${superName}UUID`] = utils.getLastResourceUUIDInURL(retData[`${superName}Href`]);
            delete retData[`${superName}Href`];
        }
    }
    retData.createdAt = retData.modifiedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    return retData;
}

module.exports = function parse(options) {
    let resourceConfig = options;
    let seneca = this;

    _.keys(resourceConfig).forEach( name =>{
        console.log(`[Parse Register]--> resource: ${name} type: parse`);
        seneca.add({resource: name, schema:'rest', type:'parse'}, (msg, done, internMeta)=>{
            let {resource,method,data:{args:{params,query,body}}}=msg;
            console.debug(`[Parse Data] --> resource:${resource},method:${method}\n${JSON.stringify({params,query,body},null,2)}`);
            let retData={};
            if(method=='create'){
                retData = createParse(resourceConfig, resource, body, params);
                console.log(`[Parse Data] --> resource:${resource},method:${method} parse date:\n${JSON.stringify(retData,null,2)}`);
            }
            else if(method=='update'){
                // 提取字段
                let restParams = resourceConfig[resource].params || {};
                let restParamKeys = _.keys(restParams);
                let hrefKeys = restParamKeys.filter(key=>_.toLower(restParams[key].type)=='url');
                // 挂接uuid
                retData.uuid = params.uuid;
                // 复制基础类型数据
                retData = _.assign(retData, body);
                // 复制转换Href
                hrefKeys.forEach(key=>{
                    if(!body[`${key}Href`]) return;
                    let isPickUUID = _.has(restParams[key],'isPickUUID')?restParams[key].isPickUUID:true;
                    if(isPickUUID){
                        retData[`${key}UUID`] = utils.getLastResourceUUIDInURL(body[`${key}Href`]);
                    }
                    retData[`${key}Href`] = body[`${key}Href`];
                });

                // 挂接上级资源UUID
                let superName = resourceConfig[resource].super;
                if( superName && !_.isEmpty(_.trim(superName))){
                    if(retData[`${superName}Href`]){
                        retData[`${superName}UUID`] = utils.getLastResourceUUIDInURL(retData[`${superName}Href`]);
                        delete retData[`${superName}Href`];
                    }
                }
                retData.modifiedAt = moment().format('YYYY-MM-DD HH:mm:ss');

                console.log(`[Parse Data] --> resource:${resource},method:${method} parse date:\n${JSON.stringify(retData,null,2)}`);
            }
            else if(method=='get'){
                retData.uuid = params.uuid;
            }
            else if(method=='delete'){
                retData.uuid = params.uuid;
            }
            else if(method=='list'){
                retData = _.assign({offset:0,limit:10},query);
                // 挂接上级资源UUID
                let superName = resourceConfig[resource].super;
                if( superName && !_.isEmpty(_.trim(superName))){
                    let uuidName = `${superName}UUID`;
                    if(_.has(params,uuidName)){
                        retData[uuidName] = params[uuidName] || 'Temp_UUID';
                    }
                    // 挂接更上级资源
                    let isHook = false;
                    let upSupers = [];
                    let upSuperName = resourceConfig[superName].super;
                    while (upSuperName) {
                        let upSuperUUIDName = `${upSuperName}UUID`;
                        let uuid = null;
                        if (_.has(params, upSuperUUIDName)) {
                            isHook = true;
                            uuid = params[upSuperUUIDName] || 'Temp_UUID';
                        }
                        let item = {name: upSuperName, uuid: uuid, linkName: superName};
                        upSupers.push(item);
                        superName = upSuperName;
                        upSuperName = resourceConfig[upSuperName].super
                    }
                    if (isHook) {
                        retData.$upSupers = upSupers;
                    }
                }
                // 关系资源
                if(resourceConfig[resource].memberships){
                    resourceConfig[resource].memberships.map(membershipResourceName=>{
                        let uuidName = `${membershipResourceName}UUID`;
                        if(_.has(params,uuidName)){
                            if(resourceConfig[resource].type=='membership'){
                                retData[uuidName] = params[uuidName] || 'Temp_UUID';
                            }
                            else {
                                retData.$membership={name:membershipResourceName,uuid:params[uuidName] || 'Temp_UUID'}
                            }
                        }
                    })
                }
                console.log(`[Parse Data] --> resource:${resource},method:${method} parse date:\n${JSON.stringify(retData, null, 2)}`);
            }
            else if(method=='listAll'){
                retData = _.assign({},query);
                // 挂接上级资源UUID
                let superName = resourceConfig[resource].super;
                if( superName && !_.isEmpty(_.trim(superName))){
                    let superUUID = `${superName}UUID`;
                    if(_.has(params,superUUID)){
                        retData[superUUID] = params[superUUID] || 'Temp-UUID';
                    }
                }
            }
            else if(method=='batchCreate'){
                body = _.isArray(body)?body:[body];
                retData = body.map(data=>createParse(resourceConfig,resource,data,params))
            }
            else {
                retData={params,query,body}
            }

            done(null,retData);
        });
    });

};