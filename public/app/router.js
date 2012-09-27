define([
  // Application.
  "app",
    'MainView',
    'LoginView',
    'ContestView'
],

function(app, MainView, LoginView, ContestView) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index",
      'contests/:contestid': '_contests'
    },

    index: function() {

        $(function() {

            var loginView = new LoginView({el: '.login-slot'});
            loginView.render();

            var mainView = new MainView({el: '.contest-list'});

        });

    },

    _contests: function(contestid) {

        var loginView = new LoginView({el: '.login-slot'});
        loginView.render();

        var contestView = new ContestView({el: '.contest-list'});

        $.ajax({
            url: [ '/apis/1/contests', contestid ].join('/')
        }).done(function(data) {
                contestView.render(data[0]);
            }).fail(function(data) {
                contestView.render(data);
            });


    }

  });

  return Router;

});
