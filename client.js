console.log('Hello world!');

/*
This form selector helps us interact with a desired form
We are differentiating between server-side js and client-side js
Document is a client-side keyword
*/
const title = document.querySelector('.title');
const form = document.querySelector('form');
const loadingElement = document.querySelector('.loading');
const postsElement = document.querySelector('.posts');
const loadMoreElement = document.querySelector('#loadMore');
const API_URL = 'http://localhost:5000/posts';

const search = document.querySelector('.search-posts');

let skip = 0;
let limit = 5;
let loading = false;
let finished = false;

loadingElement.style.display = '';

document.addEventListener('scroll', () => {
    const rect = loadMoreElement.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading && !finished) {
        loadMore();
    } 
    
});

listAllPosts();

//go to home page when clicking title
title.addEventListener('click', (event) => {
    location.reload();
});

/*
Search action listener
*/
search.addEventListener('submit', (event) => {

    console.log('Search heard');
    event.preventDefault();
    const searchData = new FormData(search);
    const searchString = searchData.get('search-content').toLowerCase(); //I have the search string
    //Do I need to hide the form elements?
    if (isValidSearch(searchString)) {
        postsElement.innerHTML = "";
        loadMoreElement.style.visibility = 'hidden';
        searchPosts(searchString);
    }
    else console.log("Invalid search.");
    
  
});

// Listen for like button clicks
postsElement.addEventListener('click', (event) => {
    event.preventDefault();

    console.log('Like heard');

    /*
    fetch(API_URL, {method: 'POST'})
    .then(function(response) {
      if(response.ok) {
        console.log('Click was recorded');
        return;
      }
      throw new Error('Request failed.');
    })
    .catch(function(error) {
      console.log(error);
    });
    */
  
});

/*
Using the EventListener we are catching the post action
This is where we are catching the data submitted in a form
and saving it in an object
This is also how you hide and show objects on the web page in js
*/
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name');
    const content = formData.get('content');
    const likeCount = 0;

    //client validation here?
    form.style.display = 'none';
    loadingElement.style.display = '';

    //defined as a javascript object
    const post = {
        name,
        content,
        likeCount
    };

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(post),
        headers: {
            'content-type': 'application/json'
        }
    }).then(response => response.json())
      .then(createdPost => {
        console.log(createdPost);
        //redisplay form and refresh post list
        form.reset();
        setTimeout(() => {
            form.style.display = '';
        }, 10000);
        listAllPosts();
        loadingElement.style.display = 'none';
    });
});

function loadMore() {
    skip += limit;
    listAllPosts(false);
}

function listAllPosts(refresh = true) {
    loading = true;
    if (refresh) {
        postsElement.innerHTML = '';
        skip = 0;
    }
    //template string: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
    fetch(`${API_URL}?skip=${skip}&limit=${limit}`)
        .then(response => response.json())
        /*
        Cannot simply call posts since we are returning an object with multiple inputs.
        Must specify we wnat the posts returned from that object.
        */
        .then(result => {
            result.posts.forEach(post => {
                //document.createElement doesn't put element on page, only creates element
                const div = document.createElement('div');

                const header = document.createElement('h3');
                /*
                textContent will only display html when html is inputted and
                it won't render the html. This is a security precaution to prevent
                what's known as cross site scripting. There is a difference between textContent,
                innerHTML, outerHTML(same as innerHTML), innerText (same relationship as textContent
                but innerText only displays visible text while textContent displays all text)
                */
                header.textContent = post.name;

                const contents = document.createElement('p');
                contents.textContent = post.content;

                const date = document.createElement('small');
                date.textContent = new Date(post.created);

                const likeBtn = createLikeBtn();

                const likes = document.createElement('small');
                likes.textContent = post.likeCount;
                likes.style.float = 'right';


                div.appendChild(header);
                div.appendChild(contents);
                div.appendChild(date);
                div.appendChild(likeBtn);
                div.appendChild(likes);

                postsElement.appendChild(div);
            });
            loadingElement.style.display = 'none';
            if(!result.meta.hasMore) {
                loadMoreElement.style.visibility = 'hidden';
                finished = true;
            } else {
            loadMoreElement.style.visibility = 'visible';
            }
            loading = false;
        });
}

/*
search posts function
*/
function searchPosts(searchString) {
    
    form.style.display = ''; //hide the forms
    postsElement.innerHTML = "";
    
    fetch(`${API_URL}`)
        .then(response => response.json())
        /*
        Cannot simply call posts
        Must specify 
        */
        .then(result => {
            result.posts.forEach(post => {

                var nameFound = post.name.toLowerCase().includes(searchString);
                var contentFound = post.content.toLowerCase().includes(searchString);
                
                if(nameFound || contentFound) {
                    
                //only creates element
                const div = document.createElement('div');

                const header = document.createElement('h3');
                
                header.textContent = post.name;

                const contents = document.createElement('p');
                contents.textContent = post.content;

                const date = document.createElement('small');
                date.textContent = new Date(post.created);

                const likeBtn = createLikeBtn();

                const likes = document.createElement('small');
                likes.textContent = post.likes;
                likes.style.float = 'right';

                div.appendChild(header);
                div.appendChild(contents);
                div.appendChild(date);
                div.appendChild(likeBtn);
                div.appendChild(likes);

                postsElement.appendChild(div);
                }
            });
            
        });
}

//Test the search string for valid input
function isValidSearch(searchString) {
    return searchString && searchString.toString().trim() !== '' && searchString.trim().length <= 20;
}

function createLikeBtn() {
    const likeBtn = document.createElement('BUTTON');
    likeBtn.innerHTML = "Like";
    likeBtn.style.float = 'right';
    likeBtn.style.bottom = 30;
    return likeBtn;
}