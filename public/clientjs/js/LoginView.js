define([], function() {

    return Backbone.View.extend({

        initialize: function() {

        },

        events: {
            'click .sign-in': '_login'
        },

        render: function() {

            this.$el.html('<a href="#" class="navbar-link sign-in">Sign In</a>');
            return this;
        },

        _login: function() {

            var button = '<div class="dropdown">' +
                '<a  data-toggle="dropdown" href="#"><i class="icon-user icon-white"></i> Dan Baker</a>' +
                '<ul class="dropdown-menu">' +
                '<li><a href="#">Profile</a></li>' +
                '<li><a href="#">Recent Games</a></li>' +
                '<li class="divider"></li>' +
                '<li><a href="#">Sign Out</a></li>' +
                '</ul>' +
                '</div>';
            this.$el.html(button);
        }

    });

//    return 'Logged in as <a href="#" class="navbar-link">Dan Baker</a>';

});