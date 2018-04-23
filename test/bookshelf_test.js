/**
 * Created by Administrator on 2018/1/22.
 */

const _ = require('lodash');
const moment = require('moment');
const utils = require('../common/utils');

let knex = require('knex')({
    client: 'mysql',
    connection: {
        host     : '192.168.7.5',
        user     : 'root',
        password : '123456',
        database : 'MicroServiceFrameDB',
        charset  : 'utf8'
    }
});

let bookshelf = require('bookshelf')(knex);
bookshelf.plugin('pagination');
// bookshelf.plugin(require('bookshelf-modelbase').pluggable);
bookshelf.plugin(require('../common/db/bookshelf-CRUD').pluggable);

function parse (response) {
    if(_.isArray(response)){return response;}
    let jsonColumnObj = (this.jsonColumns||[]).reduce((obj,item)=>{obj[item] = true;return obj;},{});
    return _.mapValues(response, function(value, key) {
        return _.isDate(value)?moment(value).format('YYYY-MM-DD HH:mm:ss'):
            jsonColumnObj[key]?JSON.parse(value):value;
    });
}

// 租户
let Tenant = bookshelf.Model.extend({
    tableName: 'Tenants',
    idAttribute: 'uuid',
    hasTimestamps: ['createdAt', 'modifiedAt'],
    // parse: parse,
    directories: function () {
        return this.hasMany(Directory, 'tenantUUID');
    }
});

// 目录
let Directory = bookshelf.Model.extend({
    tableName: 'Directories',
    idAttribute: 'uuid',
    hasTimestamps: ['createdAt','modifiedAt'],
    parse: parse,
    users: function() {
        return this.hasMany(User,'directoryUUID');
    },
    tenant: function () {
        return this.belongsTo(Tenant, 'tenantUUID');
    }
});
// 用户
let User = bookshelf.Model.extend({
    tableName: 'Users',
    idAttribute: 'uuid',
    hasTimestamps: ['createdAt','modifiedAt'],
    // format: function (data) {
    //     let jsonColumnObj = (this.jsonColumns||[]).reduce((obj,item)=>{obj[item] = true;return obj;},{});
    //     return _.mapValues(data, function(value, key) {
    //         return jsonColumnObj[key]?JSON.stringify(value):value;
    //     });
    // },
    // parse: parse,

    jsonColumns: ['data'],

    directory: function() {
        return this.belongsTo(Directory,'directoryUUID');
    },
    groups: function () {
        return this.belongsToMany(Group).through(UserGroupMembership,'userUUID','groupUUID');
    }
});
// 分组
let Group = bookshelf.Model.extend({
    tableName: 'Groups',
    idAttribute: 'uuid',
    hasTimestamps: ['createdAt','modifiedAt'],
    parse: parse,

    users: function() {
        return this.belongsToMany(User).through(UserGroupMembership,'groupUUID','userUUID');
    }
});
// 用户与分组关系
let UserGroupMembership = bookshelf.Model.extend({
    tableName: 'UserGroupMemberships',
    idAttribute: 'uuid',
    hasTimestamps: ['createdAt','modifiedAt'],
    parse: parse,

    user: function() {
        return this.belongsTo(User,'userUUID','uuid');
    },
    group: function() {
        return this.belongsTo(Group,'groupUUID','uuid');
    }
});





let time = moment().format('YYYY-MM-DD HH:mm:ss');
let userUUID = utils.createUUID();
User.create({uuid:userUUID,data:{a:'test1'}}).then(data=>{
    console.log(JSON.stringify(data,null,2))
});

//
// Directory.forge({uuid:'UONWXg9bfoBvRkoDOlNxjg'}).fetch({withRelated: ['users']}).then(directory=>{
//     console.log(`directory: ${JSON.stringify(directory.toJSON(),null,2)}`);
// });


















let data = {
    "uuid": utils.createUUID(),
    "name": "yiyp-test",
    "email": "test@qq.com",
    "mobile": "13000000002",
    "createdAt": time,
    "modifiedAt": time,
    "directoryUUID": "qKvqUmVrUUujqpIQ0KjTeA"
};


let v_data = _.range(3).map((d11,idx)=>{
    let d = _.cloneDeep(data);
    d.uuid = utils.createUUID();
    d.name = d.name+"-"+idx;
    return d;
});
// let sss = User.forge();

let methods = ['create','update','getOne','getByKeyId','listAll','list','delete','getOrCreate','upsert', // 9
    'batchCreate'
];
let mIdx = 2;
let method = methods[mIdx];
let updateData = {
    uuid: utils.createUUID(),// /'zVSiF9NhU0MNpRNhajqyFw',
    name: 'update-name'
};

let qs={
    offset: 0,
    limit: 25,
};
let $upSupers = [
    {
        "name": "tenant",
        "uuid": "ckn1R71Vvvvncta9e3Ua8w",
        "linkName": "directory"
    }
];

// User.listByUpSpuers($upSupers, qs).then(users => {
//     console.log('users:',JSON.stringify(users,null,2));
// });
// console.log('======================');

