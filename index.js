/**
 * Created by Administrator on 2018/3/5.
 */
const koaRestRouter = require('./plugins/router/koaRestRouter');
const BaseBusiness = require('./common/REST/baseBusiness');
const utils = require('./common/utils');
const errorCodeTable = require('./common/errorCodeTable');
const schema = require('./plugins/resource/schema');
const parse = require('./plugins/resource/parse');
module.exports = {
    koaRestRouter : koaRestRouter,
    BaseBusiness: BaseBusiness,
    errorCodeTable: errorCodeTable,
    getSchema: schema.getSchema,
    parse: parse.parse
};