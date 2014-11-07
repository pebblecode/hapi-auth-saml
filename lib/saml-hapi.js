/**
 * SAML wrapper to make it compatible with hapijs
 */
"use strict";

var Boom = require('Boom');

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

    if (request.payload && request.payload.SAMLResponse) {
      console.log(['debug', 'SAMLResponse']);
      saml.validatePostResponse(request.payload, validateCallback);
    } else if (request.payload && request.payload.SAMLRequest) {
      console.log(['debug', 'SAMLRequest']);
      saml.validatePostRequest(request.payload, validateCallback);
    } else {
      console.log(['debug', 'no SAML', 'headers'], request.headers);
      console.log(['debug', 'no SAML', 'info'], request.info);
      console.log(['debug', 'no SAML', 'payload'], request.payload);
      console.log(['debug', 'no SAML', 'auth'], request.auth);
      console.log(['debug', 'no SAML', 'params'], request.params);
      console.log(['debug', 'no SAML', 'body'], request.body);
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

/**
 * Authenticate payload
 */
wrapper.payload = function(options) {
  return function(request, next) {
    console.log(['debug', 'payload()', 'headers'], request.headers);
    console.log(['debug', 'payload()', 'info'], request.info);
    console.log(['debug', 'payload()', 'payload'], request.payload);
    console.log(['debug', 'payload()', 'auth'], request.auth);
    console.log(['debug', 'payload()', 'params'], request.params);
    console.log(['debug', 'payload()', 'body'], request.body);

    next(null);
  };
};

module.exports = wrapper;
