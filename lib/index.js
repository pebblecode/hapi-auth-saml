var _ = require('lodash');

var internals = {};

exports.register = function(plugin, options, next) {
  plugin.auth.scheme('saml', internals.implementation);
  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};

internals.implementation = function(server, options) {
  var settings = _.clone(options);

  var scheme = {
    authenticate: function(request, reply) {
      var credentials = {
        name: "az"
      };

      reply(null, {
        credentials: credentials
      });
    }
  };

  return scheme;
};