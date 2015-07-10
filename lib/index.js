'use strict';

var _ = require('lodash');
var Boom = require('boom');
var samlHapi = require('./saml-hapi');

/**
 * Method to register the plugin with hapi
 * @param {object} server The server object
 * @param {object} options Additional options object
 * @param {function} next Callback function once plugin is registered
 */
var registerPlugin = function (server, options, next) {

  server.auth.scheme('saml', function (requestServer, requestOptions) {
    var settings = _.clone(requestOptions);
    return {
      authenticate: samlHapi.authenticate(settings)
    };
  });

  server.auth.strategy('saml-strategy', 'saml', options.samlOptions);

  var settings = _.clone(options);

  var path = settings.path || '/saml';
  var pathLogout = settings.pathLogout ||'/logout';
  var redirectTo = settings.redirectTo || '/';


  /**
   * This route is not called, but rather it's used to redirect the user
   * to the SAML server
   */
  server.route({
    path: path,
    method: 'GET',
    config: {
      auth: 'saml-strategy',
      handler: function (request, reply) {
        // Do nothing here
      }
    }
  });

  /**
   *  This route is where the SAML token is posted back to
   */
  server.route({
    path: path,
    method: 'POST',
    config: {
      // SAML auth server redirects the user here after authentication
      handler: function (request, reply) {

        /**
         * Function to call the verification of the token
         * @param profile
         * @param done
         */
        settings.verifyFunc = function (profile, done) {
          var callback = function (err, profile) {
            if (err) {
              return Boom.badRequest(err);
            }
            // Redirect home if verified with no problems
            reply.redirect(redirectTo);
          };
          settings.samlSetAccount(request, reply, profile, callback);
        };

        samlHapi.authenticate(settings)(request, reply);
      }
    }
  });

  /**
   * Route to clear the SAML token.
   * TODO: Do a proper SAML logout implementation
   */
  server.route({
    path: pathLogout,
    method: 'GET',
    config: {
      handler: function(request, reply) {
        // Need to implement full SAML logout
        request.auth.session.clear();
        return reply.redirect('/');
      }
    }
  });

  next();
};

registerPlugin.attributes = {
  pkg: require('../package.json')
};

module.exports = registerPlugin;
