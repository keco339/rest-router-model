# rest-router-model
rest-router-model是一个根据资源描述JOSN配置文件(Resource Config)，自动生成REST风格的HTTP接口，并且完成数据模型映射。
它具有功能扩展性，可以通过BaseBusiness类继承，实现业务功能扩展。它是完全业务内包，只需要提供资源config和数据库配置即可。
这样可以更好更快的构建一个微服务，你只需要关心如何设计好你的资源模型。

框架：目前只支持[koa](https://github.com/koajs/koa)上使用。

数据库：目前只支持SQL系列数据库，如`Postgres`, `MSSQL`, `MySQL`, `MariaDB`, `SQLite3`, `Oracle`, `Amazon Redshift`。(以[knex](http://knexjs.org/)为准备)


### 安装
需要`node v8.9.0` 版本，或者更高的版本，需支持`async`函数.

```
  $ npm install rest-router-model
```

### 例子
我们将以一个学校管理服务（`SchoolServer`）为例:
首先编写一个资源配置文件：resourceConfig.js，下一节会详细的我们如何配置resourceConfig。
以下resourceConfig描述了class资源、student资源、activityGroup资源、还有一个描述学生与活动小组关联关系的studentActivityGroupMembership资源。
在student中通过`super`字段描述了他所属于上级资源为class，
在studentActivityGroupMembership中，通过`membership`字段描述他所要关联的那两个资源。
```javascript
// resourceConfig.js

module.exports = {
    // 班级
    "class": {
        rest_api: 'base',
        params: {
            name:{type:'string'},
            description:{type:'string'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        },
    },
    // 学生
    "student":{
        rest_api: 'base',
        super: 'class',
        params: {
            name:{type:'string'},
            description:{type:'string'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        },
    },
    // 活动组
    "activityGroup": {
        type: 'membershipContainer',
        rest_api: 'base',
        params: {
            name:{type:'string'},
            description:{type:'string'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        },
    },
    // 学生与活动小组的关联关系统
    "studentActivityGroupMembership":{
        type: 'membership',
        memberships : ['student','activityGroup'],
        rest_api: 'base',
        params: {
            name:{type:'string'},
            description:{type:'string'},
            createdAt: {type:'time'},
            modifiedAt:{type:'time'},
        },
    }
};
```

然后server.js中使用rest-router-model
```javascript
// server.js

const Koa = require('koa');
const restRouterModel = require('rest-router-model');
const resourceConfig = require('./resourceConfig');

let knexConfig = {
    client: 'mysql',
    connection: {
        host : 'localhost',
        user : 'db-user',
        password : 'xxxxxx',
        database : 'SchoolServerDB',
        port : 3306
    }
}
let extendBusinesses = {};        // 扩展业务接口支持
let options = {
    serverName: 'SchoolServer'，  // 配置服务的名称
    ip: 'school.server.com'，     // 配置服务域名或ip
    port: '3000'，                // 配置服务监听端口
};
const app = new Koa();
restRouterModel.koaRestRouter(resourceConfig, extendBusinesses, knexConfig, options).then(koa_router=>{
    app.use(koa_router.routes());
    app.listen(options.port);
});
```

运行成功过后，插件会在router的中注册，以下REST HTTP接口：

| Resource | Method |  URI |
|:--------|:------| :---|
|class | POST     | /api/:version/classes |
|class | GET      | /api/:version/classes |
|class | GET      | /api/:version/classes/:uuid |
|class | PUT,POST | /api/:version/classes/:uuid |
|class | DELETE   | /api/:version/classes/:uuid |
|student | POST     | /api/:version/students <br> /api/:version/classes/:classUUID/students  |
|student | GET      | /api/:version/students <br> /api/:version/classes/:classUUID/students <br> /api/:version/activityGroups/:activityGroupUUID/students |
|student | GET      | /api/:version/students/:uuid <br> /api/:version/classes/:classUUID/students/:uuid|
|student | PUT,POST | /api/:version/students/:uuid <br> /api/:version/classes/:classUUID/students/:uuid|
|student | DELETE   | /api/:version/students/:uuid <br> /api/:version/classes/:classUUID/students/:uuid|
|activityGroup | POST     | /api/:version/activityGroups |
|activityGroup | GET      | /api/:version/activityGroups <br> /api/:version/students/:studentUUID/activityGroups|
|activityGroup | GET      | /api/:version/activityGroups/:uuid |
|activityGroup | PUT,POST | /api/:version/activityGroups/:uuid |
|activityGroup | DELETE   | /api/:version/activityGroups/:uuid |
|activityGroup | POST     | /api/:version/activityGroups/:uuid/add |
|activityGroup | POST     | /api/:version/activityGroups/:uuid/remove |
|studentActivityGroupMemberships | POST     | /api/:version/studentActivityGroupMemberships |
|studentActivityGroupMemberships | GET      | /api/:version/studentActivityGroupMemberships <br> /api/:version/activityGroups/:activityGroupUUID/studentActivityGroupMemberships <br>/api/:version/students/:studentUUID/studentActivityGroupMemberships |
|studentActivityGroupMemberships | GET      | /api/:version/studentActivityGroupMemberships/:uuid|
|studentActivityGroupMemberships | PUT,POST | /api/:version/studentActivityGroupMemberships/:uuid |
|studentActivityGroupMemberships | DELETE   | /api/:version/studentActivityGroupMemberships/:uuid |



```flow
st=>start: Start
op=>operation: Your Operation
cond=>condition: Yes or No?
e=>end

st->op->cond
cond(yes)->e
cond(no)->op
```