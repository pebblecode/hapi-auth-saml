var _ = require('lodash');
var samlHapi = require('./saml-hapi');

var internals = {};

exports.register = function(plugin, options, next) {
  plugin.auth.scheme('saml', internals.implementation);

  var path = options.path || "/SAML";

  // Add callback route
  plugin.route({
    method: 'POST',
    path: path,
    handler: function(request, reply) {
      var reqInfo = {
        app: request.app,
        auth: request.auth,
        headers: request.headers,
        info: request.info,
        params: request.params,
        payload: request.payload,
        query: request.query
      };

      plugin.log(['debug', 'samlCallback'], JSON.stringify(request.auth));

      next(reqInfo);
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
    authenticate: samlHapi.authenticate(settings),
    payload: samlHapi.payload(settings)
  };

  return scheme;
};