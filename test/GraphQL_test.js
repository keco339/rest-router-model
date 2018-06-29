/**
 * Created by Administrator on 2018/5/21.
 */
const request = require('request-promise');
const { graphql, buildSchema } = require('graphql');

// 使用 GraphQL schema language 构建一个 schema

let schema = buildSchema(`
  type Query {
    name: String
    age: Int
    cabinet: Cabinet
  }
  
  type Cabinet {
    name: String
    number: String
    sn: String
  }
  
`);

// 根节点为每个 API 入口端点提供一个 resolver 函数


let root = {
    name: () => {
        return 'Hello world!';
    },
    age: () => {
        return 18;
    },
    cabinetHref: ()=>{
      return   `http://192.168.7.150:5700/api/v1.0.0/cabinets/Vz03LaXnjQzJzVfsPxwiiA`;
    },
    // cabinet: {
    //     name: (a,b,c) => {
    //         let options = {
    //             json: true, simple: true, resolveWithFullResponse: true
    //         };
    //         let cabinetHref = `http://192.168.7.150:5700/api/v1.0.0/cabinets/Vz03LaXnjQzJzVfsPxwiiA`;
    //         return request.get(cabinetHref, options)
    //             .then(function ({statusCode, body, headers, request}) {
    //                 console.log('body:',JSON.stringify(body,null,2));
    //                 return body.name;
    //             })
    //     },
    // },
    cabinet: (a,b,c) => {
        let options = {
            json: true, simple: true, resolveWithFullResponse: true
        };
        let cabinetHref = `http://192.168.7.150:5700/api/v1.0.0/cabinets/Vz03LaXnjQzJzVfsPxwiiA`;
        return request.get(cabinetHref, options)
            .then(function ({statusCode, body, headers, request}) {
                console.log('body:',JSON.stringify(body,null,2));
                return body;
            })
    },

};

// 运行 GraphQL query '{ hello }' ，输出响应
let gql = '{ name age cabinet{name number sn}}';
gql = `{name age cabinet}`;
graphql(schema, gql, root).then((response) => {
    console.log(JSON.stringify(response,null,2));
});