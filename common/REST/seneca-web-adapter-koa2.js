'use strict'

const Parse = require('co-body')
const jsonic = require('jsonic');
module.exports = function koa(
    { middleware: definedMiddleware, parseBody },
    context,
    auth,
    routes,
    done
) {
    const seneca = this

    if (!context) {
        return done(new Error('no context provided'))
    }

    routes.forEach(
        ({ autoreply, redirect, pattern, methods, path, middleware }) => {
            const routeMiddleware = (middleware || []).map(_m =>
                typeof _m === 'string' ? definedMiddleware[_m] : _m
            )
            methods.forEach(method =>
                context[method.toLowerCase()](path, ...routeMiddleware, async ctx => {
                    let body = {}

                    if (['POST', 'PUT'].indexOf(ctx.req.method) > -1) {
                        body = parseBody === false ? ctx.request.body : await Parse(ctx)
                    }

                    let msg = Object.assign({},
                        {
                            ctx: ctx,
                            request$: ctx.request,
                            response$: ctx.response,
                            args: {
                                body,
                                query: { ...ctx.request.query },
                                params: { ...ctx.params },
                                state: { ...ctx.state }
                            }
                        },
                        jsonic(pattern),
                    );

                    const res = await new Promise((resolve, reject) => {
                        seneca.act(msg, (err, res) => (err ? reject(err) : resolve(res)))
                    })

                    ctx.response.type = 'json'
                    // ctx.status = 200

                    if (redirect) {
                        ctx.redirect(redirect)
                    }

                    if (autoreply) {
                        ctx.body = res
                    }
                })
            )
        }
    )

    done(null, { routes })
}