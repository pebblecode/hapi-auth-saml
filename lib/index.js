var internals = {};

exports.register = function (plugin, options, next) {
  plugin.auth.scheme('saml', internals.implementation);
  next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

internals.implementation = function (server, options) {
  var settings = Hoek.clone(options);

  var scheme = {
    authenticate: function (request, reply) {
      // TODO
    }
  };

  return scheme;
};