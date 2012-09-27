require.config({

    deps:["start"],

    paths:{

        // JavaScript folders.
        vendor:"../vendor/js",

        // Libraries.
        jquery:"../vendor/js/jquery-1.8.1.min",
        underscore:"../vendor/js/underscore-min",
        backbone:"../vendor/js/backbone-min",
        bootstrap:"../vendor/js/bootstrap.min",
        ace: "../vendor/js/ace/ace"

    },

    shim:{

        underscore:{
            exports:"_"
        },

        backbone:{
            deps:["jquery", "underscore"],
            exports:"Backbone"
        },

        bootstrap: {
            deps: ["jquery"]
        },

        ace: {
            exports: "ace"
        }

    }

});
