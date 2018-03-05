"use strict";
const config = require("../server/config/config");
const knex = require('../models/knex').knex;
const chai = require('chai');
const expect = chai.expect;
const moment = require('moment');

const resourceURI = require('../controllers/resourceURI');
const URIParser = resourceURI.v1;
const utils = require('commonutils').utils;
const _ = require('lodash');

var initialMysqlTestData = () => {
    const timeAt = moment().format('YYYY-MM-DD HH:mm:ss');
    const  tableNames = ['Fences','Groups','MerchantGroupMemberships','CustomerGroupMemberships','Events'];


    return knex.transaction( trx => {
        return Promise.all(tableNames.map(tableName=>{
            return knex(tableName).delete().transacting(trx);
        })).then(function () {
            console.log('database initial finish.');
            return trx.commit();
        })
        .catch(function (error) {
            console.log(error);
            trx.rollback();
            throw new Error("The DBForTestCases initial failed.");
        });
    });
};


describe('initial test cases',  function() {
    it('it should initial success',  function() {
        this.timeout(0);
        if(!config.knex.client || !config.knex.connection || !config.knex.connection.database) {
            console.log('database config is error.' );
            return;
        }
        return initialMysqlTestData().then( () => {
            console.log("initial database success.");
            return Promise.resolve();
        });
    });
});