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
        app: req.app,
        auth: req.auth,
        headers: req.headers,
        info: req.info,
        params: req.params,
        payload: req.payload,
        query: req.query
      };

      plugin.log(['debug', 'samlCallback'], JSON.stringify(req.auth));

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