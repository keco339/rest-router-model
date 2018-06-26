/**
 * Created by Administrator on 2018/6/26.
 */
const request = require('request-promise');
const expect = require('chai').expect;
const _ = require('lodash');
const common = require('./common');
const url = common.url;
const utils = require('../../common/utils');

describe('membershipContainer test case:',  function (){
    let groupUUID = null;
    let userUUID = null;
    let treeUUID = null;
    it('create a group test case:',  function (){
        //this.timeout(0);
        let  options = {
            body: {
                name: 'group-test',
            },
            json: true, simple: false, resolveWithFullResponse: true
        };

        return request.post(`${url}/groups`,options)
            .then(function ({statusCode,body,headers,request}) {
                console.log('statusCode:',statusCode);
                console.log('body:',JSON.stringify(body,null,2));
                expect(statusCode).to.equal(201);
                groupUUID = utils.getResourceUUIDInURL(body.href,'groups');
            })
    });

    it('create a user test case:',  function (){
        //this.timeout(0);
        let  options = {
            body: {
                name: 'yiyp-test',
                email: 'test@qq.com',
                mobile: '13000000001',
                data: {test: 'test-abc'},
                directoryHref: `http://192.168.7.5:3000/api/v1.0.0/directories/${directoryUUID}`
            },
            json: true, simple: true, resolveWithFullResponse: true
        };

        return request.post(`${url}/users`,options)
            .then(function ({statusCode,body,headers,request}) {
                expect(statusCode).to.equal(201);
                console.log('statusCode:',statusCode);
                console.log('body:',JSON.stringify(body,null,2));
                userUUID = utils.getResourceUUIDInURL(body.href,'users');
            })
    });

    it('create a tree test case:',  function (){
        //this.timeout(0);
        let  options = {
            body: {
                name: 'tree-test',
            },
            json: true, simple: true, resolveWithFullResponse: true
        };

        return request.post(`${url}/trees`,options)
            .then(function ({statusCode,body,headers,request}) {
                expect(statusCode).to.equal(201);
                console.log('statusCode:',statusCode);
                console.log('body:',JSON.stringify(body,null,2));
                treeUUID = utils.getResourceUUIDInURL(body.href,'trees');
            })
    });

    it('add user for group test case:',  function (){
        //this.timeout(0);
        let groupUUID = 'PCRLbnuYjtsplHR0qJ623g';
        let userUUID = '6hccJAu9VK2k44nyGskC3g';
        let  options = {
            body: {
                userUUID: userUUID,
            },
            json: true, simple: true, resolveWithFullResponse: true
        };

        return request.post(`${url}/groups/${groupUUID}/addUser`,options)
            .then(function ({statusCode,body,headers,request}) {
                expect(statusCode).to.equal(201);
                console.log('statusCode:',statusCode);
                console.log('body:',JSON.stringify(body,null,2));
                userUUID = utils.getResourceUUIDInURL(body.href,'users');
            })
    });
    it('remove user for group test case:',  function (){
        //this.timeout(0);
        let groupUUID = 'PCRLbnuYjtsplHR0qJ623g';
        let userUUID = '6hccJAu9VK2k44nyGskC3g';
        let  options = {
            body: {
                userUUID: userUUID,
            },
            json: true, simple: true, resolveWithFullResponse: true
        };

        return request.post(`${url}/groups/${groupUUID}/removeUser`,options)
            .then(function ({statusCode,body,headers,request}) {
                expect(statusCode).to.equal(204);
                console.log('statusCode:',statusCode);
                console.log('body:',JSON.stringify(body,null,2));
            })
    });

    it('add tree for group test case:',  function (){
        //this.timeout(0);
        let groupUUID = 'PCRLbnuYjtsplHR0qJ623g';
        let treeUUID = 'q7zfRubyGn0dFpErlsOeEA';
        let treeHref = 'http://192.168.7.5:3000/api/v1.0.0/trees/q7zfRubyGn0dFpErlsOeEA';
        let  options = {
            body: {
                treeHref: treeHref,
            },
            json: true, simple: true, resolveWithFullResponse: true
        };

        return request.post(`${url}/groups/${groupUUID}/addTree`,options)
            .then(function ({statusCode,body,headers,request}) {
                expect(statusCode).to.equal(201);
                console.log('statusCode:',statusCode);
                console.log('body:',JSON.stringify(body,null,2));
                userUUID = utils.getResourceUUIDInURL(body.href,'users');
            })
    });
    it('remove tree for group test case:',  function (){
        //this.timeout(0);
        let groupUUID = 'PCRLbnuYjtsplHR0qJ623g';
        let treeUUID = 'q7zfRubyGn0dFpErlsOeEA';
        let treeHref = 'http://192.168.7.5:3000/api/v1.0.0/trees/q7zfRubyGn0dFpErlsOeEA';
        let  options = {
            body: {
                // treeUUID: treeUUID,
                treeHref
            },
            json: true, simple: true, resolveWithFullResponse: true
        };

        return request.post(`${url}/groups/${groupUUID}/removeTree`,options)
            .then(function ({statusCode,body,headers,request}) {
                expect(statusCode).to.equal(204);
                console.log('statusCode:',statusCode);
                console.log('body:',JSON.stringify(body,null,2));
            })
    });
});