/**
 * Created by Administrator on 2018/3/7.
 */
const request = require('request-promise');
const expect = require('chai').expect;
const _ = require('lodash');
const common = require('./common');
const url = common.url;
const utils = require('../../common/utils');



describe('Group Test Case:',function () {
    let groupUUID = null;
    describe('group test case:',  function (){
        let groupUUID = '1Y8KRKtUu1ja083dVJXJsA';
        it('create a group test case:',  function (){
            //this.timeout(0);
            let  options = {
                body: {
                    name: 'group-test',
                    // description: '',
                    merchantHref: `http://192.168.7.5:3000/api/v1.0.0/merchants/OK2TMCUK5LuOCncvvYyu1A`
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
        it('get a group test case:',  function (){
            //this.timeout(0);
            let  options = {
                json: true, simple: false, resolveWithFullResponse: true
            };
            return request.get(`${url}/groups/${groupUUID}`,options)
                .then(function ({statusCode,body,headers,request}) {
                    console.log('statusCode:',statusCode);
                    console.log('body:',JSON.stringify(body,null,2));
                    expect(statusCode).to.equal(200);
                })
        });
        it('update a group test case:',  function (){
            //this.timeout(0);

            let  options = {
                body:{name: 'group-update'},
                json: true, simple: false, resolveWithFullResponse: true
            };
            return request.post(`${url}/groups/${groupUUID}`,options)
                .then(function ({statusCode,body,headers,request}) {
                    console.log('statusCode:',statusCode);
                    console.log('body:',JSON.stringify(body,null,2));
                    expect(statusCode).to.equal(200);
                })
        });

        it('list groups test case:',  function (){
            //this.timeout(0);

            let  options = {
                qs: {limit: 2},
                json: true, simple: false, resolveWithFullResponse: true
            };
            return request.get(`${url}/groups`,options)
                .then(function ({statusCode,body,headers,request}) {
                    console.log('statusCode:',statusCode);
                    console.log('body:',JSON.stringify(body,null,2));
                    expect(statusCode).to.equal(200);
                })
        });
        it('delete a user test case:',  function (){
            //this.timeout(0);
            let  options = {
                json: true, simple: false, resolveWithFullResponse: true
            };
            return request.delete(`${url}/groups/${groupUUID}`,options)
                .then(function ({statusCode,body,headers,request}) {
                    console.log('statusCode:',statusCode);
                    console.log('body:',JSON.stringify(body,null,2));
                    expect(statusCode).to.equal(204);
                })
        });
    });
    // describe('batch user test case:',  function (){
    //     let userUUID = null;
        // it('batch create users test case:',  ()=> {
        //     //this.timeout(0);
        //     let  options = {
        //         body: [
        //             { name: 'yiyp1', mobile: '13000000001'},
        //             { name: 'keco2', mobile: '13000000002'},
        //         ],
        //         json: true, simple: true, resolveWithFullResponse: true
        //     };
        //
        //     return request.post(`${url}/users/batchCreate`,options)
        //         .then(function ({statusCode,body,headers,request}) {
        //             expect(statusCode).to.equal(201);
        //             console.log('statusCode:',statusCode);
        //             console.log('body:',JSON.stringify(body,null,2));
        //             userUUID = body.uuid;
        //         })
        //
        //
        // });
        //     it('batch get users test case:',  ()=> {
        //         //this.timeout(0);
        //
        //         let  options = {
        //             qs:{uuid:['123456','abcdef']},
        //             json: true, simple: true, resolveWithFullResponse: true
        //         };
        //         return request.get(`${url}/users/batchGet`,options)
        //             .then(function ({statusCode,body,headers,request}) {
        //                 expect(statusCode).to.equal(200);
        //                 console.log('statusCode:',statusCode);
        //                 console.log('body:',JSON.stringify(body,null,2));
        //             })
        //     });
        //     it('batch update users test case:',  ()=> {
        //         //this.timeout(0);
        //
        //         let  options = {
        //             body: [
        //                 { uuid: '123456',name: 'yiyp', mobile: '13000000001'},
        //                 { uuid: 'abcdef',name: 'keco', mobile: '13000000002'},
        //             ],
        //             json: true, simple: true, resolveWithFullResponse: true
        //         };
        //         return request.post(`${url}/users/batchUpdate`,options)
        //             .then(function ({statusCode,body,headers,request}) {
        //                 expect(statusCode).to.equal(200);
        //                 console.log('statusCode:',statusCode);
        //                 console.log('body:',JSON.stringify(body,null,2));
        //             })
        //     });
        //     it('list all users test case:',  ()=> {
        //         //this.timeout(0);
        //
        //         let  options = {
        //             qs:{name: 'test'},
        //             json: true, simple: true, resolveWithFullResponse: true
        //         };
        //         return request.get(`${url}/users/listAll`,options)
        //             .then(function ({statusCode,body,headers,request}) {
        //                 expect(statusCode).to.equal(200);
        //                 console.log('statusCode:',statusCode);
        //                 console.log('body:',JSON.stringify(body,null,2));
        //             })
        //     });
        //     it('batch delete users test case:',  ()=> {
        //         //this.timeout(0);
        //
        //         let  options = {
        //             qs:{uuid:['123456','abcdef']},
        //             json: true, simple: true, resolveWithFullResponse: true
        //         };
        //         return request.delete(`${url}/users/batchDelete`,options)
        //             .then(function ({statusCode,body,headers,request}) {
        //                 expect(statusCode).to.equal(204);
        //                 console.log('statusCode:',statusCode);
        //                 console.log('body:',JSON.stringify(body,null,2));
        //             })
        //     });
    // });
});