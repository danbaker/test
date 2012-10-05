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

            var self = this;

            if ( data.status == 404 ) {

                this.$el.html(data.statusText);

            } else {

                var html = [];

                html.push( '<p>' );
                html.push( data.name );
                html.push( '</p><p>' );
                html.push( data.description );
                html.push( '</p>' );

                var defaultCode = data.defaultCode;

                $.ajax({
                    url: [ '/apis/1/contests', data._id, 'bots' ].join('/')
                }).done(function(bots) {

                        html.push( '<div class="btn-group" style="text-align:center;">' );
                        _.each(bots, function(bot) {
                            if ( bot.name ) {
                                html.push( [ '<button class="btn">', bot.name, '</button>' ].join('') );
                            }
                        });
                        html.push( '</div><br>' );
                        html.push( '<div id="editor" class="span8" style="height: 800px;">');
                        html.push( data.defaultCode || 'function yourcodehere() {\n\n}\n' );
                        html.push( '</div>');

                        html.push( '<div class="span11" style="padding-top:820px;"><button class="btn btn-primary pull-right" type="button">Save Code</button></div>' );

                        self.$el.html( html.join('') );
                        self.$el.show();

                        var editor = ace.edit("editor");
                        editor.setTheme("ace/theme/monokai");
                        editor.getSession().setMode("ace/mode/javascript");

                    }).fail(function(data) {

                        self.$el.html( html.join('') );
                        self.$el.show();

                        var editor = ace.edit("editor");
                        editor.setTheme("ace/theme/monokai");
                        editor.getSession().setMode("ace/mode/javascript");

                    });


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