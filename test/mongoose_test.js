/**
 * Created by Administrator on 2018/1/8.
 */
const _ = require('lodash');
const moment = require('moment');
const devUtils = require('develop-utils');


const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test"); // mongodb://127.0.0.1:27017/test

let client = mongoose.connection;
client.on('error', console.error.bind(console, 'connection error:'));
client.once('open', function() {
    console.log('connected!')
    // we're connected!
});

// Schema
let customerSchema = new mongoose.Schema({
    uuid: {type: String},
    name: { type:String },
    phone: { type: String },
    age: {type: Number},
    // openIds: {type: Array, default: []},
    createdAt : { type:Date, default:Date.now },
    modifiedAt : { type:Date, default:Date.now },
    email: { type:String,}
});
// Model
let  Customer = client.model("Customers", customerSchema);
// Entity
let customer = new Customer({
    name: "keco339",
    phone: "13005462374"
});
console.log(customer.name);
console.log(customer.phone);

// customer.save(function(error,doc) {
//     if(error) {
//         console.log(error);
//     } else {
//         console.log(doc);
//     }
// });

// Model create
// Customer.create({ name:"yiyp", phone:'13005462374'}, function(error,doc){
//     if(error) {
//         console.log(error);
//     } else {
//         console.log(doc);
//     }
// });

// Model update
// let conditions = {name : 'yiyp'};
// let update = {
//     $set : {
//         modifiedAt : moment().format('YYYY-MM-DD HH:mm:ss'),
//         age: 30
//     }
// };
// Customer.update(conditions, update, function(error){
//     if(error) {
//         console.log(error);
//     } else {
//         console.log('Update success!');
//     }
// });

// Customer.remove({name:'keco339'}, function(error){
//     if(error) {
//         console.log(error);
//     } else {
//         console.log('Delete success!');
//     }
// });

// Customer.find({ /*name: 'keco339'*/ }, function (error, docs) {
//     if(error){
//         console.log("error :" + error);
//     }else{
//         console.log(JSON.stringify(docs,null,2));
//     }
// });

// let customers = _.range(10).map(i=>{
//     return{
//         name: `yiyp-${i}`,
//         phone:'13005462374'
//     }
// });
// Customer.create(customers, function(error,doc){
//     if(error) {
//         console.log(error);
//     } else {
//         console.log(doc);
//     }
// });

// Customer.find({},null,{skip:4,limit:3},function(err,docs){
//     console.log(docs);
// });

// Model create
// Customer.create({ name:"array", phone:'13005462374',openIds:['abc001','abc002']}, function(error,doc){
//     if(error) {
//         console.log(error);
//     } else {
//         console.log(doc);
//     }
// });

Customer.find({name: 'array'},function(err,docs){
    console.log(docs);
});
