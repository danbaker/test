define([
  // Application.
  "app",
    'LoginView'
],

function(app, LoginView) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function() {

        $(function() {

            var loginView = new LoginView({el: '.login-slot'});
            loginView.render();

        });

    }

  });

  return Router;

});
