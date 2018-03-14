/**
 * Created by Administrator on 2018/1/15.
 */
module.exports = {
    'tenant': {
        rest_api: 'base',
        params: {
            name: {type: 'string'},
            description: {type: 'string'},
            createdAt: {type: 'time'},
            modifiedAt: {type: 'time'},
        },
    },
    'user': {
        rest_api: 'base',//'base',//'batch',
        super: 'directory',
        extend_api: [
            {name:'sexSta', method:'GET', statusCode:200},
            {name:'fun', method:'GET', statusCode:200},
            {name: 'st', type: 'object', method: 'GET', statusCode: 200},
        ],

        params: {
            id: {type:'number'},
            name: {type:'string'},
            email: {type:'string'},
            mobile: {type:'string'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        },
    },
    'directory': {
        rest_api: 'base',
        super: 'tenant',
        params: {
            name:{type:'string'},
            description:{type:'string'},
            merchant:{type:'url'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        },
    },
    'group':{
        rest_api: 'base',
        type: 'membershipContainer',
        super: 'tenant',
        params:{
            name:{type:'string'},
            description:{type:'string'},
            merchant:{type:'url'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        }
    },
    'userGroupMembership':{
        type: 'membership',
        rest_api: 'base',
        memberships : ['user','group'],
        params:{
            user:{type:'url'},
            group:{type:'url'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        }
    },
};