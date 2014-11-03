var _ = require('lodash');
var samlHapi = require('./saml-hapi');

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
    authenticate: samlHapi.authenticate(settings)
  };

  return scheme;
};