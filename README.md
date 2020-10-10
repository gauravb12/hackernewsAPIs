# HackernewsAPIs
HackerNews Utility APIs

### Installation and Run
The project is built in NodeJS, Express and depending frameworks. An `npm install` inside the project folder would get all of those dependencies installed and then a subsequent `node app.js` would start the application.

### API 1: `/v1/top-stories`
Returns the top 10 stories ranked by score in the last 10 minutes (cached data). Each story will have the title, url, score, time of submission, and the user who submitted it.

The URLs involved in serving the API are cached once they are served for the given period of 10 minutes. This reduces the response time substantially, giving improved user experience and reduced server load.

### API 2: `/v1/comments/:itemId (/v1/comments/24739746)`
Returns the top 10 parent comments on a given story, sorted by the total number of comments (including child comments) per thread. Each comment will have the comment's text, the user’s HN handle, and their HN age. The HN age of a user is basically how old their Hacker News profile is in years.

Similar caching is done as in the previous one. Due to complex query and sorting involved caching comes handy and serves well.

### API 3: `/v1/past-stories`
Returns all the past top stories that were served previously.

Every time API 1 is served, the served Item Ids are saved so as to be served in this API. This one pulls out the details of those top-stories which have been served previously.

### Technical Specifications
The application is built in NodeJS and Express along with other minor modules as required. To ease down on the API complexity and reduce the response time, caching is implemented using `memory-cache` module. This is made to cache data (URL resource wise) for 10 minutes period.
