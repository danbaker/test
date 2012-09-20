define([

    "jquery",
    "underscore",
    "backbone"

], function($, _, Backbone) {

    return Backbone.View.extend({

        initialize: function() {

        },

        events: {
            'click .sign-in': '_login'
        },

        render: function() {

            this.$el.html('<a href="#" class="navbar-link sign-in">Sign In</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#" class="navbar-link register">Register</a>');
            return this;
        },

        _login: function() {

//            var button = '<div class="dropdown">' +
//                '<a  data-toggle="dropdown" href="#"><i class="icon-user icon-white"></i> Dan Baker</a>' +
//                '<ul class="dropdown-menu">' +
//                '<li><a href="#">Profile</a></li>' +
//                '<li><a href="#">Recent Games</a></li>' +
//                '<li class="divider"></li>' +
//                '<li><a href="#">Sign Out</a></li>' +
//                '</ul>' +
//                '</div>';
//            button = '<form class="form-inline">' +
//                '<input type="text" class="input-small" placeholder="Email">' +
//                '<input type="password" class="input-small" placeholder="Password">' +
//                '<label class="checkbox">' +
//                '<input type="checkbox"> Remember me' +
//                '</label>' +
//                '<button type="submit" class="btn">Sign in</button>' +
//                '</form>';
//            this.$el.html(button);
        }

    });

//    return 'Logged in as <a href="#" class="navbar-link">Dan Baker</a>';

});