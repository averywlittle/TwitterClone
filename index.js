/*
Dynamic back end server
*/

//define the app
const express = require('express');
//bringing in the cors module to allow communication between web client and server
const cors = require('cors');
//initializing monk db controller
const monk = require('monk');
const Filter = require('bad-words');
const rateLimit = require('express-rate-limit');

//create the app
const app = express();
//use monk lib to connect db
const db = monk('localhost/posts');
//with mongo, if the db/collection doesn't exist, it will create it
const posts = db.get('posts');
const filter = new Filter();

//cors allows us to bypass javascripts protection from interacting with servers
app.use(cors());
//We want to transform the incoming data to JSON data
app.use(express.json());


/*
Request and response
Client will make a get request to dynamic server
Dynamic server will do some processing, talk to the database
and respond with an array of JSON objects
*/
app.get('/', (req, res) => {
    res.json({
            message: 'Copy'
    });
});

/*
app.get('/posts', (req, res, next) => {
    posts
      .find()
      .then(posts => {
        res.json(posts);
      }).catch(next);
  });
*/

//use .find to retrieve all the posts and respond with all of them
app.get('/posts', (req, res, next) => {
    //destructuring: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
    let { skip = 0, limit = 10, sort = 'desc' } = req.query;
    //Math.abs() returns absolute value
    skip = parseInt(skip) || 0;
    limit = parseInt(limit) || 10;
    
    skip = skip < 0 ? 0 : skip;
    limit = Math.min(50, Math.max(1, limit));

    Promise.all([
        posts.count(),
        //querying with monk and mongodb, specifying our query
        posts.find({}, {
                skip,
                limit,
                sort: {
                    created: sort === 'desc' ? -1 : 1
                }
            })
    ])
        //dictating our response of posts and meta data
        .then(([ total, posts ]) => {
            res.json({
                posts,
                meta: {
                    total,
                    skip,
                    limit,
                    hasMore: total - (skip + limit) > 0,
                }
            });
        }).catch(next);
});


//Can use express validator framework rather than manually validating (also look at joi)
function isValidPost(post) {
    return post.name && post.name.toString().trim() !== '' && post.name.toString().trim().length <= 50 &&
    post.content && post.content.toString().trim() !== '' && post.content.toString().trim().length <= 140;
}

//by putting rate-limit here, we only rate limit the creation of a post below. We avoid rate-limiting the reqs
app.use(rateLimit({
    windowsMs: 10 * 1000, //every 10 seconds
    max: 1
}));

/*
When we recieve a post, we must validate it. Check that there is input and
it's a lawful input. Then we insert it into a collection and we respond with what was just inputted.
*/
app.post('/posts', (req, res) => {
    if (isValidPost(req.body)){
        const post = {
            name: filter.clean(req.body.name.toString()),
            content: filter.clean(req.body.content.toString()),
            likeCount: 0,
            created: new Date()
        };
        console.log(post);
        posts
            .insert(post)
            .then(createdPost => {
                res.json(createdPost);
            });

        
    } else {
        //handle this error?
        res.status(422);
        res.json({
            message: 'Hey! Name and Content are required! Name cannot be longer than 50 char and content cannot be longer than 140.'
        });
    }
});

app.listen(5000, () => {
    console.log('Listening on http://localhost:5000');
})

// add a document to the DB collection recording the click event
/*
app.post('/posts', (req, res) => {
    const click = {clickTime: new Date()};
    console.log(click);
    console.log(db);
  
    db.collection('clicks').save(click, (err, result) => {
      if (err) {
        return console.log(err);
      }
      console.log('click added to db');
      res.sendStatus(201);
    });
  });
  */
  
