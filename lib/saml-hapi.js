/**
 * SAML wrapper to make it compatible with hapijs
 */
"use strict";

var Saml = require('./saml');

var wrapper = {};

wrapper.authenticate = function(options) {
  var saml = new Saml.SAML(options);

  options.samlFallback = options.samlFallback || 'login-request';

  // Optional verify function.
  // Returns profile as is by default
  options.verifyFunc = options.verifyFunc || function(profile, done) {
    return done(null, profile);
  };

  return function(request, reply) {
    function validateCallback(err, profile, loggedOut) {
      if (err) {
        return reply(Boom.internal(err));
      }

      if (loggedOut) {
        request.logout();
        if (profile) {
          request.samlLogoutRequest = profile;
          return saml.getLogoutResponseUrl(request, redirectIfSuccess);
        }
        return reply();
      }

      var verified = function (err, user, info) {
        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.badRequest(info));
        }

        reply(null, {
          credentials: user,
          info: info
        });
      };

      // Client verification of whether profile is
      // valid or not.
      options.verifyFunc(profile, verified);
    }

    function redirectIfSuccess(err, url) {
      if (err) {
        return reply(Boom.internal(err));
      } else {
        reply.redirect(url);
      }
    }

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
        return reply(Boom.internal("No operation"));
      }
      saml[operation](request, redirectIfSuccess);
    }
  };

};

module.exports = wrapper;
