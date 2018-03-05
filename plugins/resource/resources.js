/**
 * Created by Administrator on 2018/1/15.
 */
const _ = require('lodash');
const REST = require('../../common/REST/restApi');
const register = require('../../common/REST/register');


module.exports = function resources(resourceConfig) {

    let resourceObjs = _.keys(resourceConfig).map(name=>{
        let resourceObj = {name: name};
        let apiType = resourceConfig[name].rest_api || 'batch';
        let expandApi = apiType=='base'?REST.RESTBaseApi:(apiType=='batch'?REST.RESTApi:{});
        _.assign(resourceObj, expandApi);
        (resourceConfig[name].extend_api || []).map(expand=>{
            resourceObj[expand.name] = REST.handleFn(expand.name,expand.statusCode);
        });
        return resourceObj;
    });

    let seneca = this;
    resourceObjs.forEach(resourceObj=>{
        register.restApiPatternRegister(seneca,resourceObj);
    });
};




