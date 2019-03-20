/**
 * Created by Administrator on 2018/1/19.
 */

const _ = require('lodash');
const Path = require('path');
const inflection = require( 'inflection' );

const version = 'v1.0.0';

function makeResourceHref(ip,port,resourceName,uuid) {
    return `http://${ip}:${port}/api/${version}/${inflection.pluralize(resourceName)}/${uuid}`
}
function addHttpPrefix (ip,port,path) {
    return `http://${ip}:${port}${path}`;
}

function generateResourceSchemaFn(resourceConfig,makeResourceHref ) {
    return function (name, data) {
        let params = _.keys(resourceConfig[name].params);
        let schema = {};
        // 生成资源url
        if(_.has(data,'id')){
            schema.id = data.id;
        }
        if(_.has(data,'uuid')){
            schema.href = makeResourceHref(name,data.uuid);
            schema.uuid = data.uuid;
        }


        // 复制非URL链接类属性
        let copeParams = params.filter( param => resourceConfig[name].params[param].type != 'url');
        let defaultValue = copeParams.reduce((obj,key)=>{
            let {type='string',value} = resourceConfig[name].params[key];
            obj[key]  = value || (type=='number'?0:null);
            return obj;
        },{});
        schema = _.extend(schema,defaultValue,_.pick(data,copeParams));
        // 复制生成URL链接类属性
        let urlParams = params.filter( param => resourceConfig[name].params[param].type == 'url');
        urlParams.forEach( param =>{
            let restParams = resourceConfig[name].params[param];
            let isSaveHref = _.has(restParams, 'isSaveHref') ? restParams.isSaveHref : true;
            if (isSaveHref) {
                schema[`${param}UUID`] =  data[`${param}UUID`] || null;
                schema[param] = {href: data[`${param}`] || data[`${param}Href`] || null};
            }
            else {
                let url = restParams.url;
                if (url) {
                    let regex = new RegExp(/\$\{(\w+)\}/g);
                    let array = null, keys = [];
                    while ((array = regex.exec(url)) !== null) { keys.push(array[1]);}
                    let hasKeys = keys.filter(key => !!data[key]);
                    schema[param] = {href:  (keys.length==hasKeys.length?_.template(url)(data):null) || null};
                    if(_.has(data,`${param}UUID`)){
                        schema[`${param}UUID`] =  data[`${param}UUID`] || null;
                    }
                }
                else {
                    if (resourceConfig[param]) {
                        schema[`${param}UUID`] =  data[`${param}UUID`] || null;
                        schema[param] = {href: data[`${param}UUID`]?makeResourceHref(param, data[`${param}UUID`]):null};
                    }
                    else {
                        schema[`${param}UUID`] = data[`${param}UUID`] || null;
                    }
                }
            }
        });
        // 生成上级资源链接
        let superResourceName = resourceConfig[name].super;
        if(superResourceName){
            let superResourceUUID = data[`${superResourceName}UUID`];
            schema[`${superResourceName}UUID`] = superResourceUUID || null;
            schema[superResourceName] = {href:superResourceUUID? makeResourceHref(superResourceName,superResourceUUID):null};
        }
        // 生成所有下级资源列表链接（包括下下级）
        let lowerResourceNames =  _.keys(resourceConfig).filter( n=> resourceConfig[n].super==name );
        while (!_.isEmpty(lowerResourceNames)) {
            lowerResourceNames = _.flatMap(lowerResourceNames, lowerName => {
                let pluralizeLowerName = inflection.pluralize(lowerName);
                schema[pluralizeLowerName] = {href: `${makeResourceHref(name, data.uuid)}/${pluralizeLowerName}`};
                return _.keys(resourceConfig).filter(n => resourceConfig[n].super == lowerName);
            });
        }

        // 生成关系资源链接
        if(resourceConfig[name].type!='membership'){
            (resourceConfig[name].memberships || []).map(mName=>{
                let mPName = inflection.pluralize(mName);
                schema[mPName] = {href: `${makeResourceHref(name,data.uuid)}/${mPName}`};
            });
        }
        else {
            (resourceConfig[name].memberships || []).map(resourceName=>{
                let resourceUUID = data[`${resourceName}UUID`];
                schema[resourceName] = {href: resourceUUID? makeResourceHref(resourceName,resourceUUID):null};
            });
        }
        // Tree树型结构资源链接
        if(resourceConfig[name].isTree){
            // 挂父级资源
            let parentUUID = data[`parent${_.upperFirst(name)}UUID`];
            schema[`parent${_.upperFirst(name)}UUID`] =  (parentUUID&&parentUUID!='root')?parentUUID:null;
            schema[`parent${_.upperFirst(name)}`] = {href: (parentUUID&&parentUUID!='root')?makeResourceHref(name,parentUUID):null};
            // 挂接下级子资源list资源链接
            let subKey = `sub${_.upperFirst(inflection.pluralize(name))}`;
            schema[subKey] = {href:`${makeResourceHref(name,data.uuid)}/${subKey}`};
            // 挂接查询所有子资源链接
            let allSubKey = `allSub${_.upperFirst(inflection.pluralize(name))}`;
            schema[allSubKey] = {href:`${makeResourceHref(name,data.uuid)}/${allSubKey}`};
        }

        // 编排字段顺序
        let formatSchema = _.extend({},
            _.pick(schema,['href','id','uuid']),
            _.pick(schema,_.without(_.keys(schema).filter(key=>!_.isObject(schema[key])),'createdAt','modifiedAt')),
            _.pick(schema,['createdAt','modifiedAt']),
            _.pick(schema,_.keys(schema).filter(key=>_.isObject(schema[key])&&!_.has(schema[key],'href'))),
            _.pick(schema,_.keys(schema).filter(key=>_.isObject(schema[key]))),
            );
        return formatSchema;
    };
}
let generateResourceSchema = function(resourceName, data){};
let generateListResourceSchema = function(resourceName, dataArray, offset, size, cxt){};
let generateArrayResourceSchema = function(resourceName,dataArray){};

const SingleSchemaMethods = ['create','get','update',];
const ListSchemaMethods = ['list','listAll',];
const ArraySchemaMethods = ['batchCreate','batchGet','batchUpdate',];

module.exports = function schema(options) {
    let {resourceConfig={},ip='localhost',port=3000} = options;

    let _makeResourceHref = _.partial(makeResourceHref,ip,port);
    let _addHttpPrefix = _.partial(addHttpPrefix,ip,port);

    let seneca = this;
    generateResourceSchema = generateResourceSchemaFn(resourceConfig,_makeResourceHref);
    generateListResourceSchema = function(resourceName, dataArray, offset, size, cxt) {
        return {
            href: _addHttpPrefix(cxt.request.originalUrl),
            offset, limit: dataArray.length, size,
            items: dataArray.map(data => generateResourceSchema(resourceName, data)),
        };
    };
    generateArrayResourceSchema = function(resourceName,dataArray){
        return dataArray.map(data=>generateResourceSchema(resourceName,data));
    };

    // schema.generateResourceSchema = generateResourceSchema;
    // schema.generateListResourceSchema = generateListResourceSchema;
    // schema.generateArrayResourceSchema = generateArrayResourceSchema;

    _.keys(resourceConfig).forEach( name =>{
        console.log(`[Schema Register]--> resource: ${name} type: schema`);
        seneca.add({resource: name, type:'schema',schema:'rest'}, (msg, done, internMeta)=>{
            let {method,cxt,data} = msg;
            let schema = {};
            if(_.indexOf(SingleSchemaMethods, method) > -1){
                schema = generateResourceSchema(name,data);
                if(method!='get'){
                    console.log(`[REST Schema]--> \n${JSON.stringify(schema,null,2)}`);
                }
            }
            else if(_.indexOf(ListSchemaMethods, method) > -1){
                let {offset=0,size=0,items={}} = data;
                let dataArray = _.isArray(items) ? items : [items];
                schema = generateListResourceSchema(name,dataArray,offset, size, cxt);
                console.log(`[REST Schema]--> list offset:${schema.offset}, limit:${schema.limit}, size:${schema.size}, items.length:${items.length}`);
            }
            else if(_.indexOf(ArraySchemaMethods, method) > -1){
                let dataArray = _.isArray(data) ? data : [data];
                schema = dataArray.map(data=>generateResourceSchema(name,data));
                console.log(`[REST Schema]--> array length:${schema.length}`);
            }
            else {
                schema = data;
            }
            done(null,schema);
        });
    });
};
module.exports.getSchema = function () {
    return {
        generateResourceSchema,
        generateListResourceSchema,
        generateArrayResourceSchema,
    }
};



