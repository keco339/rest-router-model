/**
 * Created by Administrator on 2018/6/27.
 */
const request = require('request-promise');
const expect = require('chai').expect;
const _ = require('lodash');
const common = require('./common');
const url = common.url;
const utils = require('../../common/utils');

function createTree(name, parentTreeUUID) {
    let options = {
        body: { name, parentTreeUUID},
        json: true, simple: false, resolveWithFullResponse: true
    };

    return request.post(`${url}/trees`, options)
        .then(function ({statusCode, body, headers, request}) {
            console.log('statusCode:', statusCode);
            console.log('body:', JSON.stringify(body, null, 2));
            let treeUUID = utils.getResourceUUIDInURL(body.href, 'trees');
            return treeUUID;
        })
}

async function createRootTree(root, parentTreeUUID=null) {
    let names = _.without(_.keys(root),'uuid');
    for(let i=0;i<names.length;i++){
        let name = names[i];
        let subTree = root[name];
        let treeUUID = await createTree(name, parentTreeUUID);
        if(!_.isEmpty(_.omit(subTree,'uuid'))){
            await createRootTree(subTree, treeUUID);
        }
        subTree.uuid = treeUUID;
    }
    return true;
}

async function createBigTrees(root) {
    let count = 10000;
    for(let i=0; i<count; i++){
        await createRootTree(root)
    }
    return true;
}

describe('tree test case:',  function () {
    let trees = {
        'A1' : {
            'B1': {
                'C1':{},
                'C2':{}
            },
            'B2': {
                'C3':{},
                'C4':{}
            }
        },
        'A2' : {
            'B3': {
                'C5':{},
                'C6':{}
            },
        }
    };
    describe('list trees test case:',  function () {
        it('create root trees test case:', function () {
            //this.timeout(0);
            // return createRootTree(trees).then(()=>console.log(JSON.stringify(trees,null,2)));
            return createRootTree(trees).then(()=>console.log(JSON.stringify(trees,null,2)));
        });

        it('list sub trees test case:', function () {
            let treeUUID = 's3OzrScWvGxQSGjuoeR7Ew';
            let options = {
                qs: {},
                json: true, simple: false, resolveWithFullResponse: true
            };

            return request.get(`${url}/trees/${treeUUID}/subTrees`, options)
                .then(function ({statusCode, body, headers, request}) {
                    console.log('statusCode:', statusCode);
                    console.log('body:', JSON.stringify(body, null, 2));
                    expect(statusCode).to.equal(200);
                })
        });
        it('list trees test case:', function () {
            let options = {
                qs: {parentTreeUUID:null},
                json: true, simple: false, resolveWithFullResponse: true
            };

            return request.get(`${url}/trees`, options)
                .then(function ({statusCode, body, headers, request}) {
                    console.log('statusCode:', statusCode);
                    console.log('body:', JSON.stringify(body, null, 2));
                    expect(statusCode).to.equal(200);
                })
        });
    });

});