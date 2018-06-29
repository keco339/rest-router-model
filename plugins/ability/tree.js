/**
 * Created by Administrator on 2018/6/27.
 */
const _ = require('lodash');
const moment = require('moment');
const inflection = require('inflection');
const BaseBusiness = require('../../common/REST/baseBusiness');
const schema = require('../resource/schema');

function sub(name) {
    let parentUIIDKey = `parent${_.upperFirst(name)}UUID`;
    return async function (data,ctx) {
        let {query, params} = data;
        query[parentUIIDKey] = params.uuid;
        let {size=0,items={}} = await this.list(query);
        let {offset=0} = query;
        let dataArray = _.isArray(items) ? items : [items];
        return schema.getSchema().generateListResourceSchema(name,dataArray,offset, size, ctx);
    };
}

function allSub(name) {
    let parentUIIDKey = `parent${_.upperFirst(name)}UUID`;
    let getAllSubUUIDs = `getAllSub${_.upperFirst(name)}UUIDs`;
    return async function (data,ctx) {
        let {query, params} = data;
        let {offset=0,limit=10} = query;
        const knex = this.dbOperater;
        let tableName = this.model.prototype.tableName;
        let queryString2SQL = this.model.queryString2SQL;
        // select * from trees,(select getSubTreeUUIDs('GDWCLx4eIMjAgRwKp0NluQ') subUUIDs) t where FIND_IN_SET(uuid, subUUIDs);
        let parentUUID = params.uuid;
        let [[{count:size=0}],items=[]] = await Promise.all([
            queryString2SQL(knex(tableName).joinRaw(`,(select ${getAllSubUUIDs}("${parentUUID}") subUUIDs) t`)
                .whereRaw(`FIND_IN_SET(uuid, subUUIDs)`)
                .count(`* as count`), _.omit(query,['offset','limit','orderBy'])),
            queryString2SQL(knex(tableName).select(`${tableName}.*`)
                .joinRaw(`,(select ${getAllSubUUIDs}("${parentUUID}") subUUIDs) t`)
                .whereRaw(`FIND_IN_SET(uuid, subUUIDs)`).offset(offset).limit(limit), _.omit(query,['offset','limit','orderBy']))
        ]);

        let dataArray = (_.isArray(items) ? items : [items]).map(item=>{
            _.keys(item).filter(key=>_.isDate(item[key])).forEach(key=>item[key]=moment(item[key]).format('YYYY-MM-DD HH:mm:ss'));
            return item;
        });
        return schema.getSchema().generateListResourceSchema(name,dataArray,offset,size,ctx);
    };
}

module.exports.hook = function hook(resourceConfig, extendBusinesses, name) {
    // 1、挂接URL
    let extend_api = resourceConfig[name].extend_api || [];

    [['sub', 200], ['allSub', 200]].map(([method,statusCode])=>{
        return [`${method}${_.upperFirst(inflection.pluralize(name))}`,statusCode];
    }).filter(([method]) => _.findIndex(extend_api, obj => (obj.name == method)) == -1)
        .forEach(([method, statusCode]) => {
            extend_api.push({name: method, type: 'object', method: 'GET', statusCode: statusCode});
        });
    resourceConfig[name].extend_api = extend_api;

    // todo: Tree型结构Schema需要进行重构
    resourceConfig[name].isTree = true;  // 在config上挂上标签是否是一颗树

    // 2、挂接method
    extendBusinesses[name] = extendBusinesses[name] || new BaseBusiness();

    // sub method
    let subMethod = `sub${_.upperFirst(inflection.pluralize(name))}`;
    extendBusinesses[name][subMethod] = sub(name);
    // allSub method
    let allSubMethod = `allSub${_.upperFirst(inflection.pluralize(name))}`;
    extendBusinesses[name][allSubMethod] = allSub(name)

};