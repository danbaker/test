define([
  // Application.
  "app",
    'LoginView',
    'ContestView'
],

function(app, LoginView, ContestView) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function() {

        $(function() {

            var loginView = new LoginView({el: '.login-slot'});
            loginView.render();

            var contestView = new ContestView({el: '.contest-list'});
//            contestView.render();

        });

    }

  });

  return Router;

});
