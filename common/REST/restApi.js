/**
 * Created by Administrator on 2018/1/14.
 */
const _ = require('lodash');
const utils = require('../utils');
let base_name = ['create','get','update','list','delete'];
let batch_name = ['batchCreate','batchGet','batchUpdate','listAll','batchDelete'];
let names = [];

let RESTApi = {};  // 所有API

let RESTBaseApi = {};    // REST 基础API
let RESTBatchApi = {};   // REST 批处理API

function getHttpStatus(method) {
    switch (method){
        case 'get':case 'update':case 'list':
        case 'batchGet':case 'batchUpdate':case 'listAll':
            return 200;
        case 'create': case 'batchCreate':
            return 201;
        case 'delete':case 'batchDelete':
            return 204;
        default:
            return 200;
    }
}

const SingleSchemaMethods = ['create','get','update',];
const ListSchemaMethods = ['list','listAll',];
const ArraySchemaMethods = ['batchCreate','batchGet','batchUpdate',];

function handleFn (method,statusCode) {
    return async function (data){
        let seneca = this.seneca;
        if( data.schema == 'rest'){
            /**
             * rest风格，HTTP携带数据结构：
             * data: {
             *  resource: string 资源名称
             *  action: string 动作，与method相同
             *  args: {
             *      params : object URL中路径参数
             *      query  : object QueryString中参数
             *      body   : object Body数据
             *  }
             *  ctx: object  koa中上下文数据
             * }
             */
            try{
                let ret = {};
                // 1、 数据解析
                if(seneca.has({resource: this.name,schema:data.schema,type:'parse'})){
                    ret = await seneca.actAsync({resource: this.name,type:'parse',schema:data.schema, method, data:data});
                }
                else {
                    ret = _.get(data, 'args.body') || {};
                }
                // 2、 Business处理
                if(seneca.has( {resource: this.name, type:'business'} )){
                    ret = await seneca.actAsync({resource: this.name,type:'business',schema:data.schema, method, data:ret});
                }
                // 3、 数据返回schema
                if(seneca.has( {resource: this.name, type:'schema', schema:data.schema} )){
                    ret = await seneca.actAsync({resource: this.name,method,type:'schema',schema:data.schema, cxt: data.ctx, data:ret});
                }
                data.ctx.status = statusCode || getHttpStatus(method);
                return ret;
            }
            catch (error){
                if(utils.isDBError(error)){error=utils.DBError(error);}
                console.error(error.orig || error);
                let body = utils.errorReturn(error);
                data.ctx.status = body.statusCode;
                return body;
            }
        }
    }
}



base_name.forEach((method)=>{
    names.push(method);
    RESTApi[method] = RESTBaseApi[method] = handleFn(method);
});

batch_name.forEach( (method) => {
    names.push(method);
    RESTApi[method] = RESTBatchApi[method] = handleFn(method);
});




module.exports = { names,base_name,batch_name, RESTApi, RESTBaseApi, RESTBatchApi ,handleFn};
