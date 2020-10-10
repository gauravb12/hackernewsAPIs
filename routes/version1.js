var express = require('express');
var axios = require('axios');
var cacheService = require('../services/cache-service');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Version 1 is UP and SERVING');
});



// to detail an item
let getItemDetails = async(itemArr) => {
	let temp = [];
	var reqPromises = [];
	for(var i=0; i<itemArr.length; i++) {
		reqPromises.push(new Promise((resolve) => {
			cacheService.httpget('https://hacker-news.firebaseio.com/v0/item/'+itemArr[i]+'.json')
				.then((resp) => {
					resolve({
						id: resp.id,
						title: resp.title,
						url: resp.url,
						score: resp.score,
						time: resp.time,
						by: resp.by
					})
				})
		}));
	}
	const response = await Promise.all(reqPromises);
	return response;
}






// API 1 --> get top stories
router.get('/top-stories', async (req, res) => {
	try {
		cacheService.httpget('https://hacker-news.firebaseio.com/v0/topstories.json')
			.then((response) => {
				var allItems = response;
				allItems = allItems.slice(0, 10); // top 10 stories
				getItemDetails(allItems)
					.then((response1) => {
						// cache this serving
						cacheService.cacheData("previouslyServedTopStories", allItems);
						res.json(response1);
					})
					.catch((error1) => {
						throw error1;
					})

			}).catch((error) => {
				throw error;
			})
		
	} catch (err) {
		throw err;
	}
})




// count children comments of a comment
let getChildrenCount = async(commentIds) => {
	if(commentIds=="" || commentIds==[] || commentIds==undefined)
		return 1;
	
	let commentCount = 0;
	let countPr = [];
	commentIds.forEach((item) => {
		countPr.push(new Promise((resolve) => {
			cacheService.httpget('https://hacker-news.firebaseio.com/v0/item/'+item+'.json')
				.then((response1) => {
					if(response1.kids) {
						getChildrenCount(response1.kids)
							.then((response2) => {
								resolve(1+response2);
							})
							.catch((error2) => {
								throw error2;
							})
					}
					else
						resolve(1)
				})
				.catch((error1) => {
					throw error1;
				})
		}))	
	})
	let res = await Promise.all(countPr);
	commentCount = res.reduce((rec, num) => {
		return rec+num;
	}, 0)
	return commentCount;
}




// get comments on an item
let getParentCommentDetails = (commentId) => { // 24633389
	return new Promise((resolve) => {
		cacheService.httpget('https://hacker-news.firebaseio.com/v0/item/'+commentId+'.json')
			.then((response1) => {
				getChildrenCount(response1.kids)
					.then((response2) => {
						resolve({
							commentId: commentId,
							text: "actualtext",
							childCount: response2,
							by: response1.by
						})
					})
			})
	})
}




// get all parent comments on an item with details
let getAllParentCommentsWithDetail = async(commentIds) => {
	let pr = [];
	console.log("Fetching parent commments...");
	console.log("Detailing Parent Comments...");
	console.log("Counting comments' children...");
	commentIds.forEach((comment) => {
		pr.push(new Promise((resolve) => {
			getParentCommentDetails(comment)
				.then((response1) => {
					resolve(response1);
				})
				.catch((error1) => {
					throw error1;
				})
		}))
	})
	let detailedParentComments = await Promise.all(pr);
	return detailedParentComments;
}




// append hackernews age of the user against each comment
let getUserHNAge = async (comments) => {
	let pr = [];
	let maxcomments = 10;
	console.log("Appending users' HN ages...");
	for(let i=0; i<maxcomments; i++) {	
		pr.push(new Promise((resolve) => {
			cacheService.httpget('https://hacker-news.firebaseio.com/v0/user/'+comments[i].by+'.json')
				.then((response1) => {
					let dateDiff = new Date() - new Date(response1.created);
					comments[i].age = Math.floor(dateDiff/31536000000);
					resolve(comments[i]);
				})
				.catch((error1) => {
					throw error1;
				})
		}))
	}
	let resp = await Promise.all(pr);
	return resp;
}




// API 2 --> get 10 parent comments on an item with details
router.get('/comments/:itemId', async (req, res) => {
	var itemId = req.params.itemId;

	if(itemId=="" || isNaN(itemId))
		res.end("INVALID Item Id. Please enter a correct one");

	cacheService.httpget('https://hacker-news.firebaseio.com/v0/item/'+itemId+'.json')
		.then((response1) => {
			let allParentComments = response1.kids;
			getAllParentCommentsWithDetail(allParentComments)
				.then((response2) => {
					// console.log("Sorting Comments on Children count...");
					response2.sort((a, b) => {
						return a.childCount-b.childCount;
					})
					getUserHNAge(response2)
						.then((response3) => {
							res.json(response3);
						})
						.catch((error3) => {
							throw error3;
						})

				})
				.catch((error2) => {
					throw error2;
				})
			// sort detailedParentComments and get top 10
			// get user HN age for each
		})
		.catch((error) => {
			throw error;
		})
})



// API 3 --> return past served/cached top-stories
router.get("/past-stories", async(req, res) => {
	let storyIds = cacheService.getData("previouslyServedTopStories");
	getItemDetails(storyIds)
		.then((response1) => {
			res.json(response1);
		})
		.catch((error1) => {
			throw error1;
		})
})



module.exports = router;