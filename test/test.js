/**
 * Created by Administrator on 2018/5/25.
 */

const _ = require('lodash');
//
// let url = 'http://x.x/${uuid}/${abc}';
// let temp = _.template(url);
//
// let regex = new RegExp(/\$\{(\w+)\}/g);
// let array = null;
// while ((array = regex.exec(url)) !== null) {
//     console.log(`Found ${array[1]}. Next starts at ${regex.lastIndex}.`);
// }
// console.log(regex.test(url));
//
// let v = regex.exec(url);
//
// // let s = temp({uuid: 'abc'});
// // console.log(s);


let str = '123456';
console.log(str);

let base64 = new Buffer(str).toString('base64');
console.log(base64);

let str1 = new Buffer(base64,'base64').toString();
console.log(str1);

console.log(JSON.stringify(_.chunk(['a', 'b', 'c', 'd','e','f','a', 'b', 'c', 'd','e','f'], 2),null,2));