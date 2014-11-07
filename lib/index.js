var _ = require('lodash');
var samlHapi = require('./saml-hapi');

var internals = {};

exports.register = function(plugin, options, next) {
  plugin.auth.scheme('saml', internals.implementation);

  var settings = _.clone(options);
  var path = settings.path || "/SAML";

  console.log(['debug', 'path', 'load-route'], path);
  // Add callback route
  plugin.route({
    method: '*',
    path: path,
    handler: function(request, reply) {
      console.log(['debug', 'callback'], JSON.stringify(request.auth));

      // Run authentication
      samlHapi.authenticate(settings)(request, reply);
    }
  });

  plugin.route({
    method: '/test',
    path: path,
    handler: function(request, reply) {
      console.log(['debug', 'test']);

      reply();
    }
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};

internals.implementation = function(server, options) {
  var settings = _.clone(options);

  var scheme = {
    authenticate: samlHapi.authenticate(settings)
  };

  return scheme;
};