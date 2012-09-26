define([

    "jquery",
    "underscore",
    "backbone"

], function($, _, Backbone) {

    return Backbone.View.extend({

        initialize: function() {

            var self = this;

            self._template = $('.contest-list').html();

            $.ajax({
                url: '/apis/1/contests'
            }).done(function(data) {
                    self.contests = data;
                    self.render();
                }).fail(function(data) {
                    alert('failed getting contests!');
                });

        },

        render: function() {

            var html = '<div class="row-fluid">';

            _.each(this.contests, function(contest, index) {

                if (index % 3 === 0) {
                    html += '</div><div class="row-fluid">';
                }
                html += '<div class="span4">';
                html += '<h2>' + contest.name + '</h2>';
                html += '<p>Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui. </p>';
                html += '<p><a class="btn" href="' + ['/contests/', contest.id].join() + '">View details &raquo;</a></p>';
                html += '</div>';
            });

            html += '</div>';

            this.$el.html(html);
            return this;

        }


    });

//    return 'Logged in as <a href="#" class="navbar-link">Dan Baker</a>';

});