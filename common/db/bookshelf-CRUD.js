/**
 * 对bookshelf-modelbase插件进行扩展。
 * 详细信息见：https://github.com/bsiddiqui/bookshelf-modelbase
 * 修改功能：
 *  1、hasTimestamps时间字段 'created_at'-->'createdAt', 'updated_at'-->'modifiedAt'
 *  2、constructor函数中，baseValidation注释掉id: Joi.any().optional()
 * 扩展功能:
 * 1、
 */
let extend = require('xtend');
let Joi = require('joi');
let _ = require('lodash');
let inflection = require( 'inflection' );
let moment = require('moment');
let difference = _.difference;
let  queryString2SQL = require('./queryString2SQL');

module.exports = function modelBase(bookshelf, params) {
    if (!bookshelf) {
        throw new Error('Must pass an initialized bookshelf instance');
    }

    let bookshelfModel = bookshelf.Model;


    let model = bookshelf.Model.extend({
        constructor: function () {
            bookshelfModel.apply(this, arguments);

            if (this.validate) {
                let baseValidation = {
                    // id might be number or string, for optimization
                    // id: Joi.any().optional(),
                    createdAt: Joi.date().optional(),
                    modifiedAt: Joi.date().optional()
                };

                this.validate = this.validate.isJoi
                    ? this.validate.keys(baseValidation)
                    : Joi.object(this.validate).keys(baseValidation);

                this.on('saving', this.validateSave);
            }
        },
        idAttribute: 'uuid',
        hasTimestamps: ['createdAt', 'modifiedAt'],
        format: function (data) {
            let jsonColumnObj = (this.jsonColumns||[]).reduce((obj,item)=>{obj[item] = true;return obj;},{});
            let dateColumnObj = (this.dateColumns||[]).reduce((obj,item)=>{obj[item] = true;return obj;},{});
            return _.mapValues(data, function(value, key) {
                if(jsonColumnObj[key]){
                    return JSON.stringify(value);
                }
                else if(dateColumnObj[key]){
                    return _.isDate(value)?moment(value).format('YYYY-MM-DD'):value;
                }
                else {
                    return value;
                }
            });
        },
        parse: function(response) {
            if(_.isArray(response)){return response;}
            let jsonColumnObj = (this.jsonColumns||[]).reduce((obj,item)=>{obj[item] = true;return obj;},{});
            let dateColumnObj = (this.dateColumns||[]).reduce((obj,item)=>{obj[item] = true;return obj;},{});
            return _.mapValues(response, function(value, key) {
                if(_.isDate(value)){
                    let format = dateColumnObj[key]?'YYYY-MM-DD':'YYYY-MM-DD HH:mm:ss';
                    return moment(value).format(format);
                }
                else if(jsonColumnObj[key]){
                    return JSON.parse(value);
                }
                else {
                    return value;
                }
            });
        },

        validateSave: function (model, attrs, options) {
            let validation;
            // model is not new or update method explicitly set
            if ((model && !model.isNew()) || (options && (options.method === 'update' || options.patch === true))) {
                let schemaKeys = this.validate._inner.children.map(child=>child.key);
                let presentKeys = Object.keys(attrs);
                let optionalKeys = difference(schemaKeys, presentKeys);
                // only validate the keys that are being updated
                validation = Joi.validate(
                    attrs,
                    optionalKeys.length
                        // optionalKeys() doesn't like empty arrays
                        ? this.validate.optionalKeys(optionalKeys)
                        : this.validate
                )
            } else {
                validation = Joi.validate(this.attributes, this.validate);
            }

            if (validation.error) {
                validation.error.tableName = this.tableName;

                throw validation.error;
            } else {
                this.set(validation.value);
                return validation.value;
            }
        },
        queryString2SQL: queryString2SQL,

        // 创建
        create: function (data, options) {
            options = extend({method:'insert',defaults:true }, options);
            return this.save(data, options).bind(this).then(raw=>{
                // return raw.fetch({require: true}).then(data=>data?data.toJSON():null)
                return this.__proto__.constructor.forge({[this.idAttribute]: raw.id}).fetch({require: true}).then(data=>data?data.toJSON():null);
            });
        },
        // 获取一个
        getOne: function (query,options) {
            options = extend({/*require: true*/}, options);
            // query = extend({},this.attributes,query);
            query = extend({}, query);
            return this.__proto__.constructor.forge(query).fetch(options).then(data=>data?data.toJSON():null);
        },
        // 用主键获取一个
        getByKeyId: function (id,options) {
            id = id || this.id;
            return this.getOne({[this.idAttribute]: id}, options);
        },
        // 更新
        update: function (data, options) {
            options = extend({method:'update',defaults:true,patch: true, require: true}, options);
            return this.save(data, options).bind(this).then(()=>this.getByKeyId());
        },
        // 列表所有
        listAll: function (filter, options) {
            filter = extend({},filter);

            let {orderBy=`${this.hasTimestamps[0]} desc`} = filter;
            let orderBys = orderBy.split(',').map(str=>str.split(' '));

            let that = this;
            let  objTemp = this.query(function (qb) {
                that.queryString2SQL(qb,_.omit(filter,['orderBy']));
            });
            objTemp = orderBys.reduce((obj,[sort,order])=> obj.orderBy(sort,order),objTemp);
            return objTemp.fetchAll(options).then(rows=>{
                return {size:rows.length,items: rows.toJSON()};
            });
        },
        // 分页列表
        list: function (filter,options) {
            filter = extend({},filter);
            let {offset=0,limit=10,orderBy=`${this.hasTimestamps[0]} desc`} = filter;
            let orderBys = orderBy.split(',').map(str=>str.split(' '));
            // let objTemp = this.where(extend({}, _.omit(filter,['offset','limit','orderBy'])));
            let that = this;
            let objTemp = this.query(function (qb) {
                that.queryString2SQL(qb,_.omit(filter,['offset','limit','orderBy']));
            });
            objTemp = orderBys.reduce((obj,[sort,order])=> obj.orderBy(sort,order),objTemp);
            return objTemp.fetchPage({offset,limit}).then(rows=>{
                return {offset,limit,size:_.get(rows,"pagination.rowCount") || 0, items: rows.toJSON()};
            });
        },
        // 删除
        'delete': function (id, options) {
            id = id || this.id;
            options = extend({require: true}, options);
            return this.__proto__.constructor.forge({[this.idAttribute]: id}).destroy(options).then(()=>true);
        },
        // 有则查询返回，没则创建
        getOrCreate: function (data, options) {
            return this.getOne(data, extend(options, {require: false}))
                .bind(this)
                .then(function (model) {
                    let defaults = options && options.defaults;
                    return model || this.create(extend(defaults, data), options)
                })
        },
        // 有则更新，没则创建
        upsert: function (selectData, updateData, options) {
            return this.findOne(selectData, extend(options, {require: false}))
                .bind(this)
                .then(function (model) {
                    return model
                        ? model.save(updateData, extend({patch: true, method: 'update'}, options))
                        : this.create(extend(selectData, updateData), extend(options, {method: 'insert'}))
                })
        },

    }, {
        queryString2SQL: queryString2SQL,
        // 创建
        create:  function(data){
            return this.forge().create(data);
        },
        // 获取一个
        getOne: function (query) {
            return this.forge().getOne(query);
        },
        // 用主键获取一个
        getByUUID: function (id) {
            return this.forge().getByKeyId(id);
        },
        getByKeyId: function (id) {
            return this.forge().getByKeyId(id);
        },
        // 更新
        update: function (data) {
            return this.forge().update(data);
        },
        // 列表所有
        listAll: function (filter) {
            return this.forge().listAll(filter);
        },
        // 分页列表
        list: function (filter) {
            return this.forge().list(filter);
        },
        listByRelated: function (relate,relateModelUUID,filter) {
            let modelInstance = this.forge();
            let relateCollection = modelInstance.related(inflection.pluralize(relate));
            let relateModel = relateCollection.relatedData.target.forge({uuid:relateModelUUID});
            let that = this;

            let {offset=0,limit=10} = (filter||{});

            let paginate =  relateModel.related(_.lowerFirst(modelInstance.tableName)).withPivot(['uuid']).query(function (qb) {
                let {offset=0,limit=10,orderBy=`${modelInstance.hasTimestamps[0]} desc`} = (filter||{});
                let orderBys = orderBy.split(',').map(str=>str.split(' '));

                // qb.where(extend({}, _.omit(filter,['offset','limit','orderBy'])));
                that.queryString2SQL(qb,_.omit(filter,['offset','limit','orderBy']));
                orderBys.forEach(([sort,order])=> qb.orderBy(sort,order));
            }).fetch().then(users=>users.toJSON());
            // let paginate = [];

            let obj = relateModel.related(_.lowerFirst(modelInstance.tableName));
            let count = obj.query(function (qb) {
                // qb.where(extend({}, _.omit(filter,['offset','limit','orderBy'])));
                that.queryString2SQL(qb,_.omit(filter,['offset','limit','orderBy']));
                obj.relatedData.selectConstraints(qb,{});
            }).count();
            // let count = 100;

            return Promise.all([paginate,count]).then(([items,count])=>({offset,limit,size:count,items}))
        },
        listByUpSpuers: function (upSupers, filter) {
            console.log(JSON.stringify(upSupers, null, 2));
            let modelInstance = this.forge();

            filter = extend({}, filter);
            let {offset = 0, limit = 10, orderBy = `${modelInstance.hasTimestamps[0]} desc`} = filter;
            let orderBys = orderBy.split(',').map(str => str.split(' '));

            let that = this;
            let objTemp = this.query(function (qb) {
                upSupers.reduce((model, {name, uuid, linkName}) => {
                    let superModel = model.related(linkName);
                    let relatedData = superModel.relatedData;
                    let curTable = relatedData.parentTableName;
                    let curForeignKey = relatedData.foreignKey;
                    let joinTable = relatedData.targetTableName;
                    let targetKey = relatedData.targetIdAttribute;
                    qb.join(joinTable, joinTable + '.' + targetKey, '=', curTable + '.' + curForeignKey);
                    if (uuid) {
                        qb.where(joinTable + '.' + `${name}UUID`, uuid);
                    }
                    // console.log(name,uuid,linkName);
                    return superModel;
                }, modelInstance);
                that.queryString2SQL(qb, _.omit(filter, ['offset', 'limit', 'orderBy']), modelInstance.tableName);
            });
            objTemp = orderBys.reduce((obj, [sort, order]) => obj.orderBy(sort, order), objTemp);
            return objTemp.fetchPage({offset, limit}).then(rows => {
                return {offset,limit,size: _.get(rows, "pagination.rowCount") || 0, items: rows.toJSON()};
            });
        },
        // 删除
        'delete': function (id) {
            return this.forge().delete(id);
        },
        // 批量创建
        batchCreate: function (dataArray) {
            dataArray = _.isArray(dataArray)?dataArray:[dataArray];
            let curCtx = this.forge();
            dataArray = dataArray.map(dataItem=>curCtx.format(dataItem));
            return bookshelf.knex.insert(dataArray).into(this.prototype.tableName).then((result)=>dataArray);
        },
        // 批量更新。
        batchUpdate: function (data) {
            let tableName = this.prototype.tableName;
            if(data.type == 'same')
            {
                let uuids = data.data.map(dataItem=>dataItem.uuid);
                let updateData = data.data[0];
                delete updateData.uuid;
                return bookshelf.knex(tableName).update(updateData).whereIn('uuid',uuids).then((result)=>{
                    //return  uuids.map(uuid=>_.assign({}, updateData,{uuid}));
                    return data.data;
                });
            }
            else
            {
                return bookshelf.knex.transaction(function (trx) {
                    Promise.resolve('start').then(function (pluginResults) {
                        let updateReq = data.data.map(dataItem=>
                            bookshelf.knex(tableName).update(dataItem).where('uuid', dataItem.uuid).transacting(trx));
                        return Promise.all(updateReq);
                    })
                        .then(trx.commit)
                        .catch(trx.rollback);
                })
                    .then(updateResults=> {
                            return data.data;
                        }
                    );
            }
        },
        batchDelete: function (data) {
            let uuids = data.uuid;
            delete data.uuid;
            return bookshelf.knex(this.prototype.tableName).delete().whereIn('uuid',uuids).then((result)=>{
                return true;
            });
        },
    });

    return model
};
function validateFunc(model, attrs, prefix = '') {
    let result;
    let filteredAttributes = {};
    let schema;

    if (model.models) {
        let clonedModel = model.clone();
        clonedModel.model();
        schema = clonedModel.models[0].schema || {};
    } else {
        schema = model.schema || {};
    }

    for (let key in attrs) {
        let item = attrs[key];
        let index = key.indexOf(prefix);
        let keyAttr = index === 0 ? key.substr(prefix.length) : key;

        if (schema && schema[keyAttr]) {
            filteredAttributes[keyAttr] = item;
        }
    }

    result = Joi.validate(filteredAttributes, Joi.object(schema), {
        stripUnknown: true,
        allowUnknown: false,
    });

    if (result.err) {
        throw result.err;
    }

    return result.value;
}
module.exports.pluggable = function (bookshelf, params) {
    bookshelf.Model = module.exports.apply(null, arguments)
};
