/**
 * Created by Administrator on 2018/6/27.
 */
const _ = require('lodash');

const membershipContainerAbility = require('./membershipContainer');
const treeAbility = require('./tree');

function hookAbilities (resourceConfig, extendBusinesses) {
    _.forIn(resourceConfig, (resource, name)=>{
        let abilities = resource.abilities;
        if(_.isArray(abilities)){
            abilities.forEach( ability =>{
                // 对关系容器挂接 添加、移出功能
                if(ability == 'membershipContainer' && resource.type == 'membershipContainer'){
                    membershipContainerAbility.hook(resourceConfig, extendBusinesses, name);
                }
                // 挂接树型结构功能
                else if(ability == 'tree'){
                    treeAbility.hook(resourceConfig, extendBusinesses, name);
                }
                else {
                    console.warn(`[Hook Ability] --> {resource:${name}} do not support "${ability}" ability!`)
                }
            });
        }
    });

    // _.keys(resourceConfig).forEach( name => {
    //     let abilities = resourceConfig[name].abilities;
    //     if(_.isArray(abilities)){
    //         abilities.forEach( ability =>{
    //             if(ability == 'membershipContainer'){ // 关系容器添加、移出功能 // 只对关系型容器支持添加、移出
    //                 if (resourceConfig[name].type == 'membershipContainer') {
    //                     membershipContainerAbility.hook(resourceConfig, extendBusinesses, name);
    //                 }
    //             }
    //             else if(ability == 'tree'){
    //                 treeAbility.hook(resourceConfig, extendBusinesses, name);
    //             }
    //             else {
    //                 console.warn(`[Hook Ability] --> {resource:${name}} do not support "${ability}" ability!`)
    //             }
    //         });
    //     }
    // });
}
module.exports = hookAbilities;