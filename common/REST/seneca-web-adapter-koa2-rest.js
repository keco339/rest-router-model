'use strict';
/**
 * 源码来源 https://github.com/senecajs/seneca-web-adapter-koa2
 * 对seneca-web-adapter-koa2源码进行修改，适配REST风格
 * 修改列表：
 *   1、 payload对象数据中，增加 koa中ctx上下文参数，给于下流处理更多的发挥空间
 *   2、 seneca事件回调处理中，注释掉 ctx.status = 200; 将HTTP状态码的控制权交给下流
 */

function _asyncToGenerator(fn) {
    return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            function step(key, arg) {
                try {
                    var info = gen[key](arg);
                    var value = info.value;
                } catch (error) {
                    reject(error);
                    return;
                }
                if (info.done) {
                    resolve(value);
                } else {
                    return Promise.resolve(value).then(function (value) {
                        step("next", value);
                    }, function (err) {
                        step("throw", err);
                    });
                }
            }

            return step("next");
        });
    };
}

const _ = require('lodash');
const Parse = require('co-body');

module.exports = function koa(options, context, auth, routes, done) {
  const seneca = this;

  // middleware is an object with keys defining middleware
  const middleware = options.middleware;

  if (!context) {
    return done(new Error('no context provided'));
  }

  _.each(routes, route => {
    // pull out middleware from the route; map strings to options' middleware.
    // if we don't get a function, blow up hard - this is a user-code problem.
    const routeMiddleware = (route.middleware || []).map(_middleware => {
      const ret = _.isString(_middleware) ? middleware[_middleware] : _middleware;
      if (!_.isFunction(ret)) {
        throw new Error(`expected valid middleware, got ${_middleware}`);
      }
      return ret;
    });
    _.each(route.methods, method => {
      context[method.toLowerCase()](route.path, ...routeMiddleware, (() => {
        var _ref = _asyncToGenerator(function* (ctx, next) {
          let body = {};

          if (['POST', 'PUT'].indexOf(ctx.req.method) > -1) {
              if(options.parseBody){
                  body = ctx.request.body = ctx.request.body? ctx.request.body : yield Parse(ctx,{limit: '10mb'});
              }
              else {
                  body = ctx.request.body
              }
          }

          const query = Object.assign({}, ctx.request.query);
          const params = ctx.params;

          const payload = {
              ctx: ctx,
              request$: ctx.request,
              response$: ctx.response,
              args: { body: body, query: query, params: params }
          };

          ctx.response.type = 'json';

          yield new Promise(function (resolve, reject) {
            seneca.act(route.pattern, payload, function (err, res) {
              if (err) {
                return reject(err);
              }

              // ctx.status = 200;

              if (route.redirect) {
                ctx.redirect(route.redirect);
              }

              if (route.autoreply) {
                ctx.body = res;
              }
              return resolve();
            });
          });
        });

        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      })());
    });
  });

  done(null, { routes: routes });
};