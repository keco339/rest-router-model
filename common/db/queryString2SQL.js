/**
 * Created by Administrator on 2018/6/28.
 */
let _ = require('lodash');

const RangeReg = /^((\[)|(\())(\w|-| |:|@)*,(\w|-| |:|@)*((\])|(\)))$/;
const NotReg = /^NOT\(((\w|-| |:|@)*)\)$/;
const NotInReg = /^NOTIN\(((\w|-| |:|@|,|\[|\])*)\)$/;
// const OrReg = /^OR\(((\w|-| |:|@)*)\)$/;
// const OrReg = /^OR\(((\w|-| |:|@|\*)*)\)$/;
const OrReg = /^OR\(((.)*)\)$/;
const OrNotReg = /^ORNOT\(((\w|-| |:|@)*)\)$/;
const OrInReg = /^ORIN\(((\w|-| |:|@|,|\[|\])*)\)$/;
const OrNotInReg = /^ORNOTIN\(((\w|-| |:|@|,|\[|\])*)\)$/;

module.exports = function queryString2SQL(queryBuilder, qs, table = null) {

    let MERGE_KEYS = qs.MERGE_KEYS || '';
    delete qs['MERGE_KEYS'];
    let mergeKeys = MERGE_KEYS.split(',').filter(key=>!_.isEmpty(key)).map(key=>_.trim(key))
        .sort((k1,k2)=>(/^OR/.test(qs[k1]) && !(/^OR/.test(qs[k2]))));
    let mergeQs = _.pick(qs,mergeKeys);
    qs = _.omit(qs,mergeKeys);
    if(!_.isEmpty(mergeQs)){
        queryBuilder.where(function () {
            queryString2SQL(this, mergeQs, table);
        })
    }

    _.forEach(qs,(value, key) =>{
        if(key=='$sql'){
            queryBuilder.whereRaw(value);
            return;
        }
        let TableKey = table ? `${table}.${key}` : key;
        if(_.isNil(value)){
            queryBuilder.whereNull(TableKey);
        }
        else if(_.isString(value)){
            // 模糊查询
            if ( value.indexOf('*') != -1) {
                if(OrReg.test(value)){
                    let v1 = OrReg.exec(value)[1];
                    let v = v1.replace(/\*/g, '%');
                    queryBuilder.orWhere(TableKey, 'like', v);
                }
                else {
                    let v = value.replace(/\*/g, '%');
                    queryBuilder.where(TableKey, 'like', v);
                }
            }
            // 区间查询
            else if(RangeReg.test(value)){
                let range = value.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                _.zip(range, [/^\[/ , /\]$/], ['>' , '<']).forEach(([v,r,s])=>{
                    if(!_.isEmpty(v)){
                        let symbol = s + (r.test(value)?'=':'');
                        queryBuilder.where(TableKey, symbol, v);
                    }
                });
            }
            // OR 或查询
            else if(OrReg.test(value)){
                let v = OrReg.exec(value)[1];
                if(_.isEmpty(v) || v.toLowerCase()=='null'){
                    queryBuilder.orWhereNull(TableKey)
                }
                else {
                    queryBuilder.orWhere(TableKey, '=', v);
                }
            }
            // OR IN 查询
            else if(OrInReg.test(value)){
                let v = OrInReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.orWhereNull(TableKey);
                }
                else {
                    let array = v.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                    queryBuilder.orWhereIn(TableKey, array);
                }
            }
            // NOT 非查询
            else if(NotReg.test(value)){
                let v = NotReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.whereNotNull(TableKey);
                }
                else {
                    queryBuilder.whereNot(TableKey, '=', v);
                }
            }
            // NOT IN 查询
            else if(NotInReg.test(value)){
                let v = NotInReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.whereNotNull(TableKey);
                }
                else {
                    let array = v.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                    queryBuilder.whereNotIn(TableKey, array);
                }
            }
            // Or Not 查询
            else if(OrNotReg.test(value)){
                let v = OrNotReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.orWhereNotNull(TableKey);
                }
                else {
                    queryBuilder.orWhereNot(TableKey, '=', v);
                }
            }
            // OR NOT IN 查询
            else if(OrNotInReg.test(value)){
                let v = OrNotInReg.exec(value)[1];
                if(_.isEmpty(v)|| v.toLowerCase()=='null'){
                    queryBuilder.orWhereNotNull(TableKey);
                }
                else {
                    let array = v.replace(/(\[)|(\])|(\")/g,"").split(',').map(str=>_.trim(str));
                    queryBuilder.orWhereNotIn(TableKey, array);
                }
            }
            else{
                queryBuilder.where(TableKey, '=', value);
            }
        }
        else if(_.isArray(value) && value.length>0){
            queryBuilder.whereIn(TableKey, value);
        }
        else {
            queryBuilder.where(TableKey, '=', value);
        }
    });
    return queryBuilder;
};

console.log(_.isNil());
