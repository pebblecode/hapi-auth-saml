/**
 * A ping federate example of how to use `hapi-auth-saml`
 */
var Hapi = require('hapi');

var port = 7771;
var server = Hapi.createServer(port);

var SamlAuth = require('../lib');

var options = require('./secrets');

server.pack.register(SamlAuth, function (err) {

  server.auth.strategy('ping', 'saml', {
    path: options.path,
    protocol: options.protocol,
    entryPoint: options.path,
    additionalEntryPointParams: options.additionalEntryPointParams,
    cert: options.cert
  });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'ping',
      handler: function(request, reply) {
        reply("<a href='/login'>Login</a>");
      }
    }
  });

  server.route({
    method: '*',
    path: '/login',
    config: {
      auth: 'ping',
      handler: function(request, reply) {
        reply(request.auth.credentials);
      }
    }
  });

  server.start(function(err) {
    console.log('Server started at:', server.info.uri);
  });

});
