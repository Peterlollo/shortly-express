var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'Users',
  initialize: function() {
    var self = this;

    bcrypt.hash(this.get('password'), null, null, function (err, hash) {
      self.set('password', hash);
    });
  
  },
});

module.exports = User;