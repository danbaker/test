define([

    "jquery",
    "underscore",
    "backbone"

], function($, _, Backbone) {

    return Backbone.View.extend({

        initialize: function() {

            this._template = $('.login-slot').html();

            this._checkIfLoggedIn();

        },

        events: {
            'click .sign-in-button': '_login',
            'click .sign-out-menu-item': '_logout'
        },

        render: function() {

            this.$el.html(this._template);
            return this;

        },

        _checkIfLoggedIn: function() {

            $.ajax({
                url: '/apis/1/sessions'
            }).done(function(data) {
                    $('.dropdown.register').hide();
                    $('.dropdown.sign-in').hide();
                    $('.dropdown.user-menu .username').html(data.name);
                    $('.dropdown.user-menu').show();
                }).fail(function(data) {
                    $('.dropdown.register').show();
                    $('.dropdown.sign-in').show();
                });

        },

        _tryLoggingIn: function(email, password) {

            $.ajax({
                type: 'POST',
                data: {
                    username: email,
                    password: password
                },
                url: '/apis/1/sessions'
            }).done(function(data) {
                    console.log('success', data);
                    $('.dropdown.register').hide();
                    $('.dropdown.sign-in').hide();
                    $('.dropdown.user-menu .username').html(data.name);
                    $('.dropdown.user-menu').show();
                }).fail(function(data) {
                    console.log('fail', data);
                    $('.dropdown.register').show();
                    $('.dropdown.sign-in').show();
                });

        },

        _login: function() {

            var email = $('#sign-in-input-email').val();
            var password = $('#sign-in-input-password').val();

            this._tryLoggingIn(email, password);

        },

        _logout: function() {

            $.ajax({
                type: 'DELETE',
                url: '/apis/1/sessions'
            }).done(function(data) {
                    $('.dropdown.register').show();
                    $('.dropdown.sign-in').show();
                    $('.dropdown.user-menu').hide();
                }).fail(function(data) {
                });

        }

    });

//    return 'Logged in as <a href="#" class="navbar-link">Dan Baker</a>';

});