
var assert = require('assert');

var errorCodeTable= {
    version: 'v1.0.0',
    updated: '2015-11-05 9:30am',

    //1001~1500 为参数错误系列
    1001: 'Missing email.',
    1002: 'Missing first name.',
    1003: 'Missing last name.',
    1004: 'Missing name.',
    1005: 'Missing birthday.',
    1006: 'Missing password.',
    1007: 'Missing gender.',
    1008: 'Missing clientId.',
    1009: 'Missing event.',
    1010: 'Missing ref.',
    1011: 'Missing userId.',
    1012: 'Missing host.',
    1013: 'Missing featured.',
    1014: 'Missing admin.',
    1015: 'Missing utcDateTime.',
    1016: 'Missing date.',
    1017: 'Missing frequency.',
    1018: 'Missing days to repeat on.',
    1019: 'Missing users to invite.',
    1020: 'Missing allow.',
    1021: 'Missing to.',
    1022: 'Missing from.',
    1023: 'Missing type.',
    1024: 'Missing postalCode.',
    1025: 'Missing region.',
    1026: 'Missing locality.',
    1027: 'Missing address.',
    1028: 'Missing longitude.',
    1029: 'Missing latitude.',
    1030: 'Missing loc.',
    1032: 'Missing description.',
    1033: 'Missing mode.',
    1034: 'Missing venue.',
    1035: 'Missing cover.',
    1036: 'Missing avatar.',
    1037: 'Missing userName.',
    1038: 'All events are created for that date range already.',
    1039: 'Missing message.',
    1040: 'Missing endsOn.',
    1041: 'Missing access.',
    1042: 'Missing mobile.',
    1043: 'Missing code.',
    1044: 'Missing account.',
    1045: 'Missing id.',
    1046: 'Missing provinceId.',
    1047: 'Missing cityId.',
    1048: 'Missing businessLicense.',
    1049: 'Missing value',
    1050: 'Missing bankCardAccount', //银行卡信息丢失
    1051: 'Missing beneficiaryBank', //开户行信息丢失
    1052: 'Missing username',
    1053: 'Missing authorization',

    //1501~2000  为资源访问错误
    1501: 'Event does not exist.',
    1502: 'User does not exist.',
    1503: 'Venue does not exist.',
    1504: 'Precheckin does not exist.',
    1505: 'Hype does not exist.',
    1506: 'Follow does not exist.',
    1507: 'Request does not exist.',
    1508: 'Post does not exist.',
    1509: 'Uname does not exist.',
    1510: 'Recurring does not exist.',
    1511: 'Moment does not exist.',
    1512: 'Venue or User username does not exist.',
    1513: 'Activity does not exist.',
    1514: 'Mobile does not exist.',
    1515: 'Value does not exist.',

    1599: 'Resources does not exist.',

    //2001~3000 为重复多次请求错误
    2001: 'Duplicate email',
    2010: 'Duplicate hype',
    2011: 'Duplicate user name',
    2012: 'Duplicate recurring events.',

    //3001~4000 为参数格式错误
    3001: 'Incorrect email format.',
    3002: 'Incorrect password format.',
    3003: 'Incorrect birthday format',
    3004: 'Password complexity not met.',
    3005: 'Incorrect date format.',
    3006: 'Incorrect user name format.',
    3007: 'Incorrect mobile format.',
    3010: 'Incorrect value format.',
    3500: 'Incorrect uuid format.',
    3501: 'Account is disabled.',

    3999: 'Incorrect data format.',

    //4500~5000 为认证权限许可类错误
    4500: 'Permission denied to view event.',
    4501: 'Permission denied to view user.',
    4502: 'Permission denied to view venue.',
    4503: 'Permission denied to delete event.',
    4504: 'Permission denied to delete user.',
    4505: 'Permission denied to delete venue.',
    4506: 'Permission denied. Account does not have access to web.',
    4507: 'Permission denied. Account does not have access to iOS.',
    4508: 'Permission denied to post with this event.',
    4509: 'Permission denied.',
    4510: 'Permission denied to hype with this event.',
    4511: 'Permission denied to update this event.',
    4512: 'Permission denied to remove host from this event.',
    4513: 'Permission denied to remove featured from this event.',
    4514: 'Permission denied to remove admin from this event.',
    4515: 'Permission denied to post with this venue.',
    4516: 'Permission denied to update this venue.',
    4517: 'Permission denied to hype with this venue.',
    4518: 'Permission denied to remove admin from this venue.',
    4519: 'Permission denied. Event is private.',
    4520: 'Permission denied to push to venue followers. You must be an admin.',
    4521: 'Permission denied to push to venue followers. You must be an admin.',
    4522: 'Permission denied to delete event. You can only delete an event if it was created in the last 24 hours.',
    4523: 'Permission denied to change username. You can only change your username before 24 hours after creation.',

    //5000~5999 为基础硬件、第三方资源错误
    5000: 'API Down',
    5001: 'Database Down',
    5002: 'Website Down',
    5003: 'Redis Down',
    5004: 'S3 Down',
    5005: 'Timeout',
    5006: 'TSP Down',
    5007: 'TSI Down',
    5008: 'BOSS Down',
    5100: 'Database server instruction execution fail.',

    //7000~7999 为业务类逻辑错误
    7000: 'Cannot precheckin to venue.',
    7001: 'Precheckin exists already.',
    7002: 'You are not old enough to use this application.',
    7003: 'Account not activated yet. We are only letting in a few users during the phase of release.',
    7004: 'You\'re not an admin.',
    7005: 'You cannot hype yourself.',
    7006: 'Hype exists already.',
    7007: 'You cannot follow yourself.',
    7008: 'Follow exists already.',
    7009: 'No future recurring events found.',
    7010: 'You cannot remove yourself as admin.',
    7011: 'Too many recurring events.',
    7012: 'Event is already recurring.',
    7013: 'Venue with that name exists already.',
    7014: 'User is already an admin.',
    7015: 'Request already accepted.',
    7016: 'Event is already recurring.',
    7017: 'User is already an admin of that event.',
    7018: 'Venue cannot be an admin.',
    7019: 'Venue cannot have a host.',
    7020: 'Venue cannot have a feature.',
    7021: 'You cannot send invites to venues.',
    7022: 'You cannot send invites to events.',
    7023: 'Only an event can send invites.',
    7024: 'Incorrect password.',
    7025: 'Cannot checkin to venue.',
    7026: 'Request exists already.',
    7027: 'Event is not recurring.',
    7028: 'Maybe is not a valid response.',
    7029: 'Username taken.',
    7030: 'You cannot change the datetime for all recurrances.',
    7031: 'Report exists already.',
    7032: 'The extend date cannot be earlier than the last recurrance.',
    7033: 'You cannot create or update a resource because another resource already exists or conflicts with one you are submitting.',
    7034: 'Verification code expiration.',
    7035: 'Verification code failure.',
    7036: 'Get resource error.An unknown error.',  //获取资源时未知错误
    7037: 'The resource is not only.The system could not judge which one.',         //资源不唯一
    7038: 'Can\'t find the resources.',         //资源不存在
    7039: 'Delete resource error.An unknown error.',  //删除资源时未知错误
    7040: 'Update resource error.An unknown error.',  //更新资源时未知错误
    7041: 'Create resource error.An unknown error.',  //创建资源时未知错误
    7042: 'The request is frequent.', //请求过于频繁
    7043: 'The application does not mapping accountStore.', //应用程序没有关联映射账户的存储容器
    7044: 'Failed to send email! May be email proxy server error!',
    7045: 'Failed to get userInfo! upMerchant status is disabled error!',  //获取登录时的用户信息时商户状态为禁用，禁止获取。

    //9000~9999 其它类错误
    9000: 'Program code bug',
    9998: 'Bad params.',
    9999: 'Unknown Error'
};
var missingReg = new RegExp('^Missing ');
var missingParam2Code = {};
for(var property in errorCodeTable){
    if(missingReg.test(errorCodeTable[property])){
        var strV = errorCodeTable[property].split( /[ .]/);
        assert(strV.length>=2);
        assert(strV[0]==='Missing');

        var text = strV[1];
        for( var i=2; i<strV.length; i++){
            text += strV[i].substring(0,1).toUpperCase() + strV[i].substring(1);
        }
        missingParam2Code[text] = Number(property);
    }
}

var formatReg = new RegExp('^Incorrect ');
var formatParam2Code = {};
for(var property in errorCodeTable){
    if(formatReg.test(errorCodeTable[property])){
        var strV = errorCodeTable[property].split( /[ .]/);
        assert(strV.length>=2);
        assert(strV[0]==='Incorrect');

        var text = strV[1];
        for( var i=2; i<strV.length; i++){
            if(strV[i]==='format'){ break; }
            text += strV[i].substring(0,1).toUpperCase() + strV[i].substring(1);
        }
        formatParam2Code[text] = Number(property);
    }
}

var resourcesDoesNotExistReg = new RegExp('does not exist.$');
var resourcesDoesNotExist2Code = {};
for(var property in errorCodeTable){
    if(resourcesDoesNotExistReg.test(errorCodeTable[property])){
        var strTemp = errorCodeTable[property].split( /does not exist./);
        var strV = strTemp[0].split(' ');
        assert(strV.length>=2);

        var text = strV[0].toLowerCase();
        for( var i=1; i<strV.length; i++){
            text += strV[i].substring(0,1).toUpperCase() + strV[i].substring(1);
        }
        resourcesDoesNotExist2Code[text] = Number(property);
    }
}


exports.code2Text = function(code ){
    return errorCodeTable.hasOwnProperty(code) ? errorCodeTable[code] : errorCodeTable[9999];
};
exports.missingParam2Code = function( param ){
    return missingParam2Code.hasOwnProperty(param)?missingParam2Code[param] : 9998;
};
exports.formatParam2Code = function( param ){
    return formatParam2Code.hasOwnProperty(param)?formatParam2Code[param] : 3999;
};
exports.resourcesDoesNotExist2Code = function( resources ){
    return resourcesDoesNotExist2Code.hasOwnProperty(resources)?resourcesDoesNotExist2Code[resources] : 1599;
};


