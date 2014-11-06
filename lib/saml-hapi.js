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
      console.log(['debug', 'validateCallback'], profile);

      if (err) {
        return reply(Boom.internal(err));
      }

      if (loggedOut) {
        console.logout();
        if (profile) {
          request.samlLogoutRequest = profile;
          return saml.getLogoutResponseUrl(request, redirectIfSuccess);
        }
        return reply();
      }

      var verified = function (err, user, info) {
        console.log(['debug', 'verified', 'user'], user);
        console.log(['debug', 'verified', 'info'], info);

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
      console.log(['debug', 'pre-verifyFunc'], profile);
      request.info = request.info || {};
      request.info.test = "Testing";
      options.verifyFunc(profile, verified);
    }

    function redirectIfSuccess(err, url) {
      console.log(['debug', 'redirectIfSuccess'], url);

      if (err) {
        return reply(Boom.internal(err));
      } else {
        reply.redirect(url);
      }
    }

    if (request.body && request.body.SAMLResponse) {
      console.log(['debug', 'SAMLResponse']);
      saml.validatePostResponse(request.body, validateCallback);
    } else if (request.body && request.body.SAMLRequest) {
      console.log(['debug', 'SAMLRequest']);
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
