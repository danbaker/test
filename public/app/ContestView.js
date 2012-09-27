define([

    "jquery",
    "underscore",
    "backbone"

], function($, _, Backbone) {

    return Backbone.View.extend({

        initialize: function() {

            var self = this;

        },

        render: function(data) {

            console.log(data);

            if ( data.status == 404 ) {
                this.$el.html(data.statusText);
            } else {
                this.$el.html(['<p>', data.name, '</p><p>', data.description, '</p>'].join(''));
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