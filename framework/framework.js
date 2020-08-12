
const Patrun = require('patrun');
const devUtils = require('develop-utils');
const jsonic = require('jsonic');
class Framework {
    constructor(options={}) {
        this.timeout = options.timeout || 60*1000;
        this.actrouter = Patrun({ gex: true });
    }

    add(pattern, func){
        let data = {
            pattern: pattern,
            func: func,
        };
        this.actrouter.add(pattern, data);
    }
    has(pattern){
        return !!this.actrouter.find(pattern, { exact: true });
    }
    act(msg, replyFunc){
        let data = this.actrouter.find(msg);
        if(!data){
            devUtils.Error('FrameworkError',404,1599,`act error, not find msg: ${jsonic.stringify(msg)}`);
        }
        let {pattern,func} = data;
        msg.$run = false;

        function done(err, ret) {
            if(!msg.$run){
                msg.$run = true;
                replyFunc(err, ret);
            }
            if(timer){
                // console.log('clearTimeout');
                clearTimeout(timer)
            }
        }
        let timer = null;
        if(this.timeout > 1000){
            timer = setTimeout(()=>{
                timer = null;
                let error = new Error();
                error.name = 'TimeoutError';
                error.status = 500;
                error.code = 9999;
                error.message = `act error, run timeout: ${jsonic.stringify(msg)}`;
                error.description = error.message;
                done(error)
            },this.timeout)
        }
        func(msg, done);
    }

    async actAsync(msg){
        return new Promise( (resolve,reject) => {
            this.act(msg, function (err, ret) {
                if(err){
                    reject(err);
                }
                else {
                    resolve(ret);
                }
            });
        })
    }

}

module.exports = Framework;

// let fw = new Framework({
//     timeout: 5*1000
// });
//
// fw.add({a:1,b:2},(msg ,done)=>{
//     let ret = {msg:msg, ret:{d:1}};
//     setTimeout(()=>{
//         console.log(`fw.add setTimeout`);
//         done(null,ret);
//     },4*1000)
//
// });
//
// fw.act({a:1,b:2,i:1}, (err,ret)=>{
//     console.log(`fw.act setTimeout`);
//     console.log(err,ret)
// });

// fw.actAsync({a:1,b:2,i:1}).then(ret=>console.log(ret)).catch(err=>console.log(err));
