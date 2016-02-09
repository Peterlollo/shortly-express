var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(__dirname + '/public'));




app.get('/',
function(req, res) {
  res.render('index');
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

app.get('/signup', function(req, res) {
  res.render('signup');
  res.send(200);
});

app.get('/login', function(req, res){
  res.render('login');
  res.send(200);
})

app.post('/login', function(req, res){
  var passwordInput = req.body.password;
  var usernameInput = req.body.username;
  db.knex('users').select('username', 'password').then(function(user) {
    console.log('password;, ', user);
    user.forEach(function(item) {
      bcrypt.compare(passwordInput, item.password, function (err, response) {
        if(response === true && item.username === usernameInput) {
          res.redirect('/');
         }
      });
     
      
    })
  });
})

// User signup page
app.post('/signup', function(req, res) {
  var newUser = new User(req.body);
  newUser.save().done();
  res.redirect('/');
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// function checkAuth(req, res, next) {
//   if (!req.session.user_id) {
//     res.send('You are not authorized to view this page');
//   } else {
//     next();
//   }
// }

// app.use('/test', checkAuth, function(req, res) {
//   res.send('if you are viewing this page that means you are logged in');
// });

// app.post('/login', function(request, response) {
//   var username = request.body.username;
//   var password = request.body.password;

//   if (username == 'demo' && password == 'password') {
//     request.session.regenerate(function() {
//       request.session.user = username;
//       // response.redirect('/restricted');
//     });
//   } else {
//     response.redirect('login');
//   }
// });

// app.get('/', function(request, response){
//   // Authenticate user
//   //  If user not signed in
//   //    Redirect to login page
// });

// app.get('/restricted', restrict, function(request, response) {
//   response.send('Restricted area!');
// })

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
