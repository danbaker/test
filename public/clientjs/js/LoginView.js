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
            this.$el.html('Logged in as <a href="#" class="navbar-link">Dan Baker</a>');
        }

    });

//    return 'Logged in as <a href="#" class="navbar-link">Dan Baker</a>';

});