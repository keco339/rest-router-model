/**
 * Created by Administrator on 2018/1/29.
 */
const _ = require('lodash');
const moment = require('moment');
const utils = require('../../common/utils');
const inflection = require( 'inflection' );


module.exports = function dbModelBuilder(options) {
    let {resourceConfig={},dbConfig={}} = options;
    let models = {},knex = null,bookshelf = null;

    knex = require('knex')(dbConfig);
    bookshelf = require('bookshelf')(knex);
    bookshelf.plugin('pagination');
    bookshelf.plugin(require('../../common/db/bookshelf-CRUD').pluggable);

    let resourceNames = _.keys(resourceConfig);

    resourceNames.forEach( name =>{
        console.log(`[DB Model Builder]-->create resource: ${name} type: db_model`);
        let {dbName=null,super:superName=null,params={}}=resourceConfig[name];

        let ModelExtendObj = {
            tableName: dbName || inflection.camelize(inflection.pluralize(name)),
            // idAttribute: 'uuid',
            // hasTimestamps: ['createdAt','modifiedAt'],
            // parse: parse,
            jsonColumns: [],
        };
        // 添加json字段
        _.keys(params).forEach(column=>{
            if(params[column].type=='json'){
                ModelExtendObj.jsonColumns.push(column);
            }
        });

        // 上级关系处理
        if(superName){
            ModelExtendObj[superName] = function () {
                return this.belongsTo(models[superName],`${superName}UUID`);
            }
        }

        if(resourceConfig[name].type!='membership'){
            // 下级关系处理
            resourceNames.forEach(belowResourceName=>{
                if(resourceConfig[belowResourceName].super == name){
                    ModelExtendObj[inflection.pluralize(belowResourceName)] = function() {
                        return this.hasMany(models[belowResourceName],`${name}UUID`);
                    };
                }
            });
            // 多对多membership关系处理
            let memberships = resourceConfig[name].memberships;
            if(memberships && _.isArray(memberships) && memberships.length==2){
                let [membershipName,otherName] = resourceConfig[name].memberships;
                ModelExtendObj[inflection.pluralize(otherName)] = function() {
                    return this.belongsToMany(models[otherName]).through(models[membershipName],`${name}UUID`,`${otherName}UUID`);
                };
            }
        }
        else {
            resourceConfig[name].memberships.forEach(otherName=>{
                ModelExtendObj[otherName] = function() {
                    return this.belongsTo(models[otherName],`${otherName}UUID`,'uuid');
                };
            });
        }
        // console.log(name, ModelExtendObj);
        models[name] = bookshelf.Model.extend(ModelExtendObj);
    });

    return {knex,bookshelf,models};
};

