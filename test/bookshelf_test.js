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
    return _.mapValues(response, function(value, key) {
        return _.isDate(value)?moment(value).format('YYYY-MM-DD HH:mm:ss'):value;
    });
}

// 目录
let Directory = bookshelf.Model.extend({
    tableName: 'Directories',
    idAttribute: 'uuid',
    hasTimestamps: ['createdAt','modifiedAt'],
    parse: parse,
    users: function() {
        return this.hasMany(User,'directoryUUID');
    }
});
// 用户
let User = bookshelf.Model.extend({
    tableName: 'Users',
    idAttribute: 'uuid',
    hasTimestamps: ['createdAt','modifiedAt'],
    parse: parse,

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
userUUID = 'PVldWwwAcidHY0Sb2aclzw';

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

// User[method](v_data).then(data=>{
//     console.log(`forge-->${method}:\n${JSON.stringify(data/*.toJSON()*/,null,2)}`);
// });

// User.forge().query({where:{name:'keco339'}}).fetchAll().then(data=>{
//     console.log(`forge-->${method}:\n${JSON.stringify(data.toJSON(),null,2)}`);
// });
// {offset:0,limit:2,orderBy:'id asc'}
// User.forge()[method]().then(data=>{
//     console.log(`forge-->${method}:\n${JSON.stringify(data/*.toJSON()*/,null,2)}`);
// });

// User.forge(/*{uuid:'zVSiF9NhU0MNpRNhajqyFw'}*/).getByKeyId().then(data=>{
//     console.log(`forge-->getOne:\n${JSON.stringify(data.toJSON(),null,2)}`);
// });

// User.batchCreate(v_data).then(d=>{
//     console.log('batchCreate',d);
// });

// User.forge().save(data,{method:'insert',defaults:true }).then(()=>{
//     User.forge({uuid:data.uuidgify(user.toJSON(),null,2));
//     });
// });


// select * from `books` where id = 1
// select * from `authors` where id = book.author_id

// User.forge({uuid: '0B4SkBxYnxSc84tTUrRm8Q'}).fetch(/*{withRelated: ['groups']}*/).then(function(user) {
//     console.log(JSON.stringify(user.toJSON(),null,2));
//     let g = user.related('groups').fetch().then(groups=>{
//         console.log('groups:',JSON.stringify(groups.toJSON(),null,2));
//     });
//     console.log(JSON.stringify(user.toJSON(),null,2));
//     console.log(JSON.stringify(user.related('groups')));
// });
// User.forge({uuid: '0B4SkBxYnxSc84tTUrRm8Q'}).related('groups').fetch().then(groups=>{
//     console.log('groups:',JSON.stringify(groups.toJSON(),null,2));
// });

// Group.forge({uuid: 'wze2YOSawp3ApNdgdbp26A'}).related('users').fetch().then(users=>{
//     console.log('users:',JSON.stringify(users.toJSON(),null,2));
// });

// let obj = Group.forge({uuid: 'wze2YOSawp3ApNdgdbp26A'});
// let obj1 = obj.related('users');//.withPivot(['uuid','createdAt'])
// obj1.withPivot(['uuid','createdAt']).query(function (qb) {
//     //(0, _lodash.assign)(qb, _this.query().clone());
//     qb.limit(25);
//     qb.offset(0);
//     return null;
// }).fetch().then(users=>{
//     console.log('users:',JSON.stringify(users.toJSON(),null,2));
// });
let qs={
    offset: 0,
    limit: 25,
    name: 'keco339'
};
User.listByRelated('group','wze2YOSawp3ApNdgdbp26A',qs).then(users=>{
    console.log('users:',JSON.stringify(users,null,2));
});


