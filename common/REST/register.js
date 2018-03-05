/**
 * Created by Administrator on 2018/1/15.
 */
const _ = require('lodash');
const co = require('co');

function restApiPatternRegister(seneca, resourceObj){
    let actions = [];
    resourceObj.seneca = seneca;
    for (let key in resourceObj) {
        if( _.isFunction(resourceObj[key]) ){
            let funcTag = '[object Function]', asyncTag = '[object AsyncFunction]', genTag = '[object GeneratorFunction]';
            let _fn = resourceObj[key];
            let _functionType = Object.prototype.toString.call(_fn);
            actions.push(key);
            seneca.add({resource: resourceObj.name, type:'api', action: key}, (msg, done, internMeta)=>{
                // console.log(`[Seneca Action]--> ${_functionType} ${JSON.stringify(msg)}`);
                msg.schema = 'rest';
                if(_functionType==funcTag){
                    done(_fn.call(resourceObj,msg));
                }
                else if(_functionType==genTag){
                    co(_fn.call(resourceObj,msg)).then(data=>done(null,data)).catch(error=>done(error));
                }
                else if(_functionType==asyncTag){
                    _fn.call(resourceObj,msg).then(data=>done(null,data)).catch(error=>done(error));
                }
                else {
                    done(null,{msg,_fn});
                }
            });
        }
    }
    console.log(`[API Register] --> resource: ${resourceObj.name}  action: ${actions}`);
}

module.exports={
    restApiPatternRegister
};