/**
 * Created by Administrator on 2018/2/28.
 */
const _ = require('lodash');
const boom = require('boom');
const errorCodeTable = require('../errorCodeTable');

class BaseBusiness{
    constructor(name,model,dbOperater){
        this.init(name,model,dbOperater);
    }
    init(name,model,dbOperater){
        this.name = name;
        this.model = model;
        this.dbOperater = dbOperater;
    }
    create(data){ return this.model.create(data);}
    update(data){
        let that = this;
        return this.model.update(data).catch(e=>{
            let errMsg = { code:1599,description: `resource: ${that.name}, uuid: ${data.uuid}`};
            throw boom.notFound(errorCodeTable.code2Text(errMsg.code),errMsg);
        });
    }
    get(data){
        let that = this;
        return this.model.getOne(data).then(obj=>{
            if(obj){ return obj;}
            let errMsg = { code:1599,description: `resource: ${that.name}, uuid: ${data.uuid}`};
            throw boom.notFound(errorCodeTable.code2Text(errMsg.code),errMsg);
        });
    }
    getByUUID(uuid){return this.model.get({uuid});}
    delete(uuid){
        let that = this;
        return this.model.delete(_.isObject(uuid)?uuid.uuid:uuid).catch(e=>{
            let errMsg = { code:1599,description: `resource: ${that.name}, uuid: ${uuid}`};
            throw boom.notFound(errorCodeTable.code2Text(errMsg.code),errMsg);
        });
    }
    list(data){
        let $membership = data.$membership;
        if($membership){
            let {name,uuid}=data.$membership;
            return this.listByRelated(name,uuid,_.omit(data,['$membership']));
        }
        else {
            return this.model.list(data);
        }
    }
    listByRelated(name,uuid,data){
        return this.model.listByRelated(name,uuid,data);
    }
    listAll(data){ return this.model.listAll(data);}
    batchCreate(data){ return this.model.batchCreate(data);}
}

module.exports = BaseBusiness;
