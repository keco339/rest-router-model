/**
 * Created by Administrator on 2018/1/30.
 */
const _ = require('lodash');
const co = require('co');
const boom = require('boom');
const errorCodeTable = require('../../common/errorCodeTable');
const dbModelBuilder    = require('../db/model');
const BaseBusiness = require('../../common/REST/baseBusiness');

module.exports = function restBusiness(options) {
    let seneca = this;
    let {resourceConfig = {}, dbConfig={}, extendBusinesses={}} = options;
    let {knex,bookshelf,models} = dbModelBuilder({resourceConfig,dbConfig});

    let resourceNames = _.keys(resourceConfig);
    let businesses = {};
    resourceNames.forEach(name=>{
        let extendBusiness = extendBusinesses[name] || new BaseBusiness();
        extendBusiness.init(name, models[name], knex, resourceConfig, models,businesses);
        businesses[name] = extendBusiness;
    });

    // {resource: this.name, type:'business', schema:data.schema, method}
    _.keys(resourceConfig).forEach( name =>{
        console.log(`[Business Register]--> resource: ${name} type: business`);
        seneca.add({resource: name, type:'business'}, (msg, done, internMeta)=>{
            let {resource,method,schema,cxt,data}=msg;

            if(!(method in businesses[resource])){
                let errMsg = { code:1599,description: `the business of "${resource}" resource don't implement the "${method}" method`};
                done(boom.notFound(errorCodeTable.code2Text(errMsg.code),errMsg));
            }

            let funcTag = '[object Function]', asyncTag = '[object AsyncFunction]', genTag = '[object GeneratorFunction]';
            let _fn = businesses[resource][method];
            let _functionType = Object.prototype.toString.call(_fn);
            let resultPromise = null;
            if(_functionType==funcTag){
                resultPromise = Promise.resolve(_fn.call(businesses[resource],data,cxt));
            }
            else if(_functionType==genTag){
                resultPromise = co(_fn.call(businesses[resource],data,cxt));
            }
            else if(_functionType==asyncTag){
                resultPromise = _fn.call(businesses[resource],data,cxt);
            }
            else {
                resultPromise = Promise.resolve(data,cxt);
            }
            // resultPromise.then(result=>{done(null,_.isObject(result)?result:{result});}).catch(done);
            resultPromise.then(result=>{done(null,result);}).catch(done);
        });
    });
};