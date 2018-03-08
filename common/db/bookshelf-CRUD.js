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


const RangeReg = /^((\[)|(\())(\w|-| |:|@)*,(\w|-| |:|@)*((\])|(\)))$/;
const NotReg = /^NOT\(((\w|-| |:|@)*)\)$/;
const NotInReg = /^NOTIN\(((\w|-| |:|@|,|\[|\])*)\)$/;
const OrReg = /^OR\(((\w|-| |:|@)*)\)$/;
const OrNotReg = /^ORNOT\(((\w|-| |:|@)*)\)$/;
const OrInReg = /^ORIN\(((\w|-| |:|@|,|\[|\])*)\)$/;
const OrNotInReg = /^ORNOTIN\(((\w|-| |:|@|,|\[|\])*)\)$/;

function queryString2SQL(queryBuilder, qs) {
    _.forEach(qs,(value, key) =>{
        if(_.isEmpty(value)){
            queryBuilder.whereNull(key);
        }
        else if(_.isString(value)){
            // 模糊查询
            if ( value.indexOf('*') != -1) {
                let v = value.replace(/\*/g, '%');
                queryBuilder.where(key, 'like', v);
            }
            // 区间查询
            else if(RangeReg.test(value)){
                let range = value.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                _.zip(range, [/^\[/ , /\]$/], ['>' , '<']).forEach(([v,r,s])=>{
                    if(!_.isEmpty(v)){
                        let symbol = s + (r.test(value)?'=':'');
                        queryBuilder.where(key, symbol, v);
                    }
                });
            }
            // OR 或查询
            else if(OrReg.test(value)){
                let v = OrReg.exec(value)[1];
                if(_.isEmpty(v) || v.toLowerCase()=='null'){
                    queryBuilder.orWhereNull(key)
                }
                else {
                    queryBuilder.orWhere(key, '=', v);
                }
            }
            // OR IN 查询
            else if(OrInReg.test(value)){
                let v = OrInReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.orWhereNull(key);
                }
                else {
                    let array = v.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                    queryBuilder.orWhereIn(key,array);
                }
            }
            // NOT 非查询
            else if(NotReg.test(value)){
                let v = NotReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.whereNotNull(key);
                }
                else {
                    queryBuilder.whereNot(key,'=',v);
                }
            }
            // NOT IN 查询
            else if(NotInReg.test(value)){
                let v = NotInReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.whereNotNull(key);
                }
                else {
                    let array = v.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                    queryBuilder.whereNotIn(key,array);
                }
            }
            // Or Not 查询
            else if(OrNotReg.test(value)){
                let v = OrNotReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.orWhereNotNull(key);
                }
                else {
                    queryBuilder.orWhereNot(key,'=',v);
                }
            }
            // OR NOT IN 查询
            else if(OrNotInReg.test(value)){
                let v = OrNotInReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.orWhereNotNull(key);
                }
                else {
                    let array = v.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                    queryBuilder.orWhereNotIn(key,array);
                }
            }
            else{
                queryBuilder.where(key, '=', value);
            }
        }
        else if(_.isArray(value) && value.length>0){
            queryBuilder.whereIn(key,value);
        }
        else if(_.isEmpty(value)){
            queryBuilder.whereNull(key);
        }
        else {
            queryBuilder.where(key, '=', value);
        }
    });
}

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
        parse: function(response) {
            return _.mapValues(response, function(value, key) {
                return _.isDate(value)?moment(value).format('YYYY-MM-DD HH:mm:ss'):value;
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
            query = extend({},this.attributes,query);
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
            let that = this;
            return this.query(function (qb) {
                that.queryString2SQL(qb,filter);
            }).fetchAll(options).then(rows=>{
                return {size:rows.length,items: rows.toJSON()};
            })
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
                return {size:_.get(rows,"pagination.rowCount") || 0, items: rows.toJSON()};
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

            let paginate =  relateModel.related(modelInstance.tableName.toLowerCase()).withPivot(['uuid']).query(function (qb) {
                let {offset=0,limit=10,orderBy=`${modelInstance.hasTimestamps[0]} desc`} = (filter||{});
                let orderBys = orderBy.split(',').map(str=>str.split(' '));

                // qb.where(extend({}, _.omit(filter,['offset','limit','orderBy'])));
                that.queryString2SQL(qb,_.omit(filter,['offset','limit','orderBy']));
                orderBys.forEach(([sort,order])=> qb.orderBy(sort,order));
            }).fetch().then(users=>users.toJSON());
            // let paginate = [];

            let obj = relateModel.related(modelInstance.tableName.toLowerCase());
            let count = obj.query(function (qb) {
                // qb.where(extend({}, _.omit(filter,['offset','limit','orderBy'])));
                that.queryString2SQL(qb,_.omit(filter,['offset','limit','orderBy']));
                obj.relatedData.selectConstraints(qb,{});
            }).count();
            // let count = 100;

            return Promise.all([paginate,count]).then(([items,count])=>({size:count,items}))
        },
        // 删除
        'delete': function (id) {
            return this.forge().delete(id);
        },
        // 批量创建
        batchCreate: function (dataArray) {
            dataArray = _.isArray(dataArray)?dataArray:[dataArray];
            return bookshelf.knex.insert(dataArray).into(this.prototype.tableName).then((result)=>dataArray);
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
}
