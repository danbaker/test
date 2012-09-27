define([

    "jquery",
    "underscore",
    "backbone",
    "ace"

], function($, _, Backbone, ace) {

    return Backbone.View.extend({

        initialize: function() {

            var self = this;

        },

        render: function(data) {

            console.log(data);

            if ( data.status == 404 ) {

                this.$el.html(data.statusText);

            } else {

                var html = [];

                html.push( '<p>' );
                html.push( data.name );
                html.push( '</p><p>' );
                html.push( data.description );
                html.push( '</p>' );

                html.push( '<div id="editor" class="span8" style="height: 800px;">');
                html.push( data.code || 'function yourcodehere() {\n\n}\n' );
                html.push( '</div>');

                html.push( '<button class="btn btn-primary" type="button" style="padding-top:820px;">Save Code</button>' );

                this.$el.html( html.join('') );
                this.$el.show();

                var editor = ace.edit("editor");
                editor.setTheme("ace/theme/monokai");
                editor.getSession().setMode("ace/mode/javascript");

            }
            this.$el.fadeIn();

//            var html = '<div class="row-fluid">';
//
//            _.each(this.contests, function(contest, index) {
//
//                if (index % 3 === 0) {
//                    html += '</div><div class="row-fluid">';
//                }
//                html += '<div class="span4">';
//                html += '<h2>' + (!!contest.name ? contest.name : 'No name') + '</h2>';
//                html += '<p>' + (!!contest.description ? contest.description : 'No description') + '</p>';
//                html += '<p><a class="btn" href="' + ['/contests/', contest._id].join('') + '">View details &raquo;</a></p>';
//                html += '</div>';
//            });
//
//            html += '</div>';
//
//            this.$el.html(html);
//            this.$el.fadeIn();

            return this;

        }


    });

//    return 'Logged in as <a href="#" class="navbar-link">Dan Baker</a>';

});