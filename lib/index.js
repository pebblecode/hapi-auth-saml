var _ = require('lodash');
var saml = require('./saml');

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
    authenticate: internals.authenticationFunc(settings)
  };

  return scheme;
};

internals.authenticationFunc = function(options) {
  var _saml = new saml.SAML(options);

  options.samlFallback = options.samlFallback || 'login-request';

  function validateCallback(err, profile, loggedOut) {
    if (err) {
      return self.error(err);
    }

    if (loggedOut) {
      req.logout();
      if (profile) {
        req.samlLogoutRequest = profile;
        return _saml.getLogoutResponseUrl(req, redirectIfSuccess);
      }
      return self.pass();
    }

    var verified = function (err, user, info) {
      if (err) {
        return self.error(err);
      }

      if (!user) {
        return self.fail(info);
      }

      self.success(user, info);
    };

    self._verify(profile, verified);
  }

  function redirectIfSuccess(err, url) {
    if (err) {
      self.error(err);
    } else {
      self.redirect(url);
    }
  }

  return function(request, reply) {

    var credentials = {
      name: "az"
    };

    if (request.body && request.body.SAMLResponse) {
        _saml.validatePostResponse(request.body, validateCallback);
    } else if (request.body && request.body.SAMLRequest) {
        _saml.validatePostRequest(request.body, validateCallback);
    } else {
      var operation = {
        'login-request': 'getAuthorizeUrl',
        'logout-request': 'getLogoutUrl'
      }[options.samlFallback];

      if (!operation) {
        reply({
          msg: "fail!"
        });

        return;
      }
      _saml[operation](request, redirectIfSuccess);
    }

    reply(null, {
      credentials: credentials
    });
  };

};
