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

        events: {
            'click .bot-button': '_botButtonClicked',
            'click .new-bot-button': '_newBotButtonClicked'
        },

        _botButtonClicked: function(e) {
            var botId = $(e.target).attr('data-bot-id');

            var code = this.defaultCode;

            _.each(this.bots, function(bot) {
                if ( botId === bot._id && bot.code ) {
                    code = bot.code;
                }
            });

            alert(code);

        },

        _newBotButtonClicked: function(e) {
            var self = this;

            $.ajax({
                type: 'post',
                url: [ '/apis/1/contests', this.data._id, 'bots' ].join('/'),
                data: {
                    doc: JSON.stringify({ name: 'Untitled', code: self.data.defaultCode})
                }
            })
            .done(function(bot) {
                    self.render(self.data);
            });
        },

        render: function(data) {

            var self = this;

            self.data = data;

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
                this.defaultCode = data.defaultCode;

                $.ajax({
                    url: [ '/apis/1/contests', data._id, 'bots' ].join('/')
                }).done(function(bots) {

                        self.bots = bots;

                        html.push( '<div class="btn-group" style="text-align:center;">' );
                        _.each(bots, function(bot) {
                            if ( bot.name && bot.code ) {
                                html.push( [ '<button class="btn bot-button" data-bot-id="', bot._id, '">', bot.name, '</button>' ].join('') );
                            }
                        });
                        html.push( [ '<button class="btn btn-primary new-bot-button">', 'Create new bot', '</button>' ].join('') );
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

                        html.push( '<div class="btn-group" style="text-align:center;">' );
                        html.push( [ '<button class="btn btn-primary new-bot-button">', 'Create new bot', '</button>' ].join('') );
                        html.push( '</div>');

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