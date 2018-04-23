/**
 * Created by Administrator on 2018/3/1.
 */
const restRouterModel = require('../../../index');
let BaseBusiness = restRouterModel.BaseBusiness;
let getSchema = restRouterModel.getSchema;

const devUtils = require('develop-utils');

class UserBusiness extends BaseBusiness{
    constructor(abc){
        super();
        this.abc = abc;
    }
    async sexSta(data,cxt){
        // devUtils.Error('InternalError',404,9999,`The status of order`);
        let {items,size}  = await super.list({});
        let schema = getSchema().generateListResourceSchema(this.name,items,0,size,cxt);
        return schema;
        // return {name:this.name,method:'sexSta',abc:this.abc}
    }
    fun(){
        return {name: this.name, method: 'fun', abc: this.abc}
    }

    st(data){
        return {name:this.name,method:'st',abc:this.abc,data,name:this.name,model:this.model,dbOperater:this.dbOperater}
    }
}
module.exports = UserBusiness;