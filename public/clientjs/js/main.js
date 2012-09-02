requirejs.config({
    baseUrl: 'clientjs/js',
    paths: {
        app: '../app'
    }
});

require(['LoginView'], function(LoginView) {

    $(function() {

        var loginView = new LoginView({el: '.login-slot'});
        loginView.render();

    });

});