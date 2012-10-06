define([

  "underscore",
  "backbone"

], function (_, Backbone) {

  var Sessions = Backbone.Model.extend({

    defaults:{
      'logged-in': undefined,
      'user-id': undefined,
      'email': undefined,
      'error-text': undefined
    },

    initialize:function () {

      var self = this;
      this.checkSessionStatus();

    },

    getUserId: function() {
      return this.get('user-id');
    },

    onUserIdChange: function(cb, ctx) {

      this.on('all', cb, ctx);

    },

    getEmail: function() {
      return this.get('email');
    },

    isUserLoggedIn: function() {
      return this.get('logged-in');
    },

    register: function(email, password) {

      var self = this;

      $.ajax({
        type:'GET',
        url:'/apis/1/createuser/' + email + '/' + password
      }).done(function (data) {
          self.set('logged-in', true);
          self.set('user-id', data._id);
          self.set('email', data.name);
        }).fail(function () {
          self._clearAllSessionSettings();
        });

    },

    login: function(email, password) {

      var self = this;

      $.ajax({
        type: 'POST',
        data: {
          username: email,
          password: password
        },
        url: '/apis/1/sessions'
      })
      .done(function(data) {
        self.set('logged-in', true);
        self.set('user-id', data._id);
        self.set('email', data.name);
      }).fail(function(data) {
          self._clearAllSessionSettings();
      });

    },

    logout: function() {

      var self = this;

      $.ajax({
        type: 'DELETE',
        url: '/apis/1/sessions'
      })
      .done(function(data) {
          self._clearAllSessionSettings();
      });

    },

    _clearAllSessionSettings: function() {

      this.set('logged-in', false);
      this.set('user-id', undefined);
      this.set('email', undefined);
      this.set('error-text', undefined);

    },

    checkSessionStatus: function() {

      var self = this;

      $.ajax({
        url:'/apis/1/sessions'
      })
        .done(function (data) {
          self.set('logged-in', true);
          self.set('user-id', data._id);
          self.set('email', data.name);
        })
        .fail(function () {
          self._clearAllSessionSettings();
        });

    }

  });

  return new Sessions();

});