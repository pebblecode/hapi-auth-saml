/**
 * SAML wrapper to make it compatible with hapijs
 */
"use strict";

var Saml = require('./saml');

var wrapper = {};

wrapper.authenticate = function(options) {
  var saml = new Saml.SAML(options);

  options.samlFallback = options.samlFallback || 'login-request';

  function validateCallback(err, profile, loggedOut) {
    if (err) {
      return self.error(err);
    }

    if (loggedOut) {
      req.logout();
      if (profile) {
        req.samlLogoutRequest = profile;
        return saml.getLogoutResponseUrl(req, redirectIfSuccess);
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
      saml.validatePostResponse(request.body, validateCallback);
    } else if (request.body && request.body.SAMLRequest) {
        saml.validatePostRequest(request.body, validateCallback);
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
      saml[operation](request, redirectIfSuccess);
    }

    reply(null, {
      credentials: credentials
    });
  };

};

module.exports = wrapper;
