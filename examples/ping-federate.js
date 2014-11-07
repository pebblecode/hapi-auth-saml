/**
 * A ping federate example of how to use `hapi-auth-saml`
 */
var Hapi = require('hapi');

var port = 80;
var server = Hapi.createServer(port);

var SamlAuth = require('../lib');

var options = require('./secrets');

server.pack.register(SamlAuth, function (err) {
  var samlOptions = {
    path: options.path,
    protocol: options.protocol,
    entryPoint: options.entryPoint,
    additionalEntryPointParams: options.additionalEntryPointParams,
    cert: options.cert,
    /**
     * Check whether profile returned contains the
     * correct information
     *
     * @param  {Object}   profile
     * @param  {function(err, profile, info)} done
     * @return {function} `done` function
     */
    verifyFunc: function(profile, done) {
      // Can check profile contains the correct
      // information here
      server.log(['debug', 'verifyFunc'], profile);

      return done(null, profile);
    }
  };

  if (options.issuer) {
    samlOptions.issuer = options.issuer;
  }

  server.auth.strategy('ping', 'saml', samlOptions);


  server.route({
    method: 'GET',
    path: '/',
    config: {
      handler: function(request, reply) {
        reply("<h1>Homepage (no auth)</h1><a href='/login'>Login</a>");
      }
    }
  });

  server.route({
    method: 'GET',
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
