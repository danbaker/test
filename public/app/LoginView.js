define([

  "jquery",
  "underscore",
  "backbone",

  'models/Sessions'

], function ($, _, Backbone, Sessions) {

  return Backbone.View.extend({

    initialize:function () {

      this._template = $('.login-slot').html();

      Sessions.onUserIdChange(this._loggedInChanges, this);

    },

    events:{
      'click .register-button':'_register',
      'click .sign-in-button':'_login',
      'click .sign-out-menu-item':'_logout'
    },

    render:function () {

      this.$el.html(this._template);

      this._loggedInChanges();

      return this;

    },

    _loggedInChanges: function() {

      if ( Sessions.isUserLoggedIn() ) {
        $('.dropdown.register').hide();
        $('.dropdown.sign-in').hide();
        $('.dropdown.user-menu .username').html(Sessions.getEmail());
        $('.dropdown.user-menu').show();
      } else {
        $('.dropdown.register').show();
        $('.dropdown.sign-in').show();
        $('.dropdown.user-menu').hide();
      }

    },

    _register:function () {

      var email = $('#register-input-email').val();
      var password = $('#register-input-password').val();

      Sessions.register(email, password);

    },

    _login:function () {

      var email = $('#sign-in-input-email').val();
      var password = $('#sign-in-input-password').val();

      Sessions.login(email, password);

    },

    _logout:function () {

      Sessions.logout();

    }

  });

});