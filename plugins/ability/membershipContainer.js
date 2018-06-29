/**
 * Created by Administrator on 2018/6/26.
 */
const _ = require('lodash');
const inflection = require('inflection');
const BaseBusiness = require('../../common/REST/baseBusiness');
const utils = require('../../common/utils');
const schema = require('../resource/schema');

function add(name,membershipName, otherName) {
    let otherUUIDKey = `${otherName}UUID`,otherHrefKey = `${otherName}Href`;
    let thisUUIDKey = `${name}UUID`;
    let pluralizeOtherName = inflection.pluralize(otherName);

    return async function (data) {
        let {body, params} = data;
        let otherUUID = body[otherUUIDKey] || utils.getResourceUUIDInURL(body[otherHrefKey], pluralizeOtherName);

        let membershipPair = { [otherUUIDKey]: otherUUID, [thisUUIDKey]: params.uuid,};
        let membershipModel = this.models[membershipName];
        let membership = await membershipModel.getOne(membershipPair);
        if (! membership) {
            membershipPair.uuid = utils.createUUID();
            let createData = _.extend(membershipPair, _.omit(body,[otherHrefKey]));
            membership = await membershipModel.create(createData);
        }
        return schema.getSchema().generateResourceSchema(membershipName, membership);

    };
}

function remove(name, membershipName, otherName) {
    let otherUUIDKey = `${otherName}UUID`,otherHrefKey = `${otherName}Href`;
    let thisUUIDKey = `${name}UUID`;
    let pluralizeOtherName = inflection.pluralize(otherName);

    return async function (data) {
        let {body, params} = data;
        let otherUUID = body[otherUUIDKey] || utils.getResourceUUIDInURL(body[otherHrefKey], pluralizeOtherName);

        let membershipPair = { [otherUUIDKey]: otherUUID, [thisUUIDKey]: params.uuid,};
        let membershipModel = this.models[membershipName];
        let membership = await membershipModel.getOne(membershipPair);
        if (membership) {
            return await membershipModel.delete(membership.uuid);
        } else {
            return {result: true};
        }
    };
}


module.exports.hook = function hook(resourceConfig, extendBusinesses, name) {
    // 1、挂接URL
    let extend_api = resourceConfig[name].extend_api || [];
    let memberships = resourceConfig[name].memberships || [];
    let multi_memberships = _.chunk(memberships,2);

    _.flatMap([['add', 201], ['remove', 204]],(([method,statusCode])=>{
        return multi_memberships.map(([membershipName, otherName])=>{
            return [`${method}${_.upperFirst(otherName)}`,statusCode];
        })
    })).filter(([method]) => _.findIndex(extend_api, obj => (obj.name == method)) == -1)
        .forEach(([method, statusCode]) => {
            extend_api.push({name: method, type: 'object', method: 'POST', statusCode: statusCode});
        });
    resourceConfig[name].extend_api = extend_api;

// 2、挂接method
    extendBusinesses[name] = extendBusinesses[name] || new BaseBusiness();
    multi_memberships.forEach(([membershipName, otherName])=>{
        // add method
        let addMethod = `add${_.upperFirst(otherName)}`;
        extendBusinesses[name][addMethod] = add(name, membershipName, otherName);
        // remove method
        let removeMethod = `remove${_.upperFirst(otherName)}`;
        extendBusinesses[name][removeMethod] = remove(name, membershipName, otherName)
    });
};
