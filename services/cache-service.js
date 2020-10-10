var cache = require('memory-cache');
var memCache = new cache.Cache();
let duration = 10*60; // mins
const axios = require('axios');



// to get cached user data (not URL responses)
let getData = (keyStr) => {
	let key = "__cached__"+keyStr;
	let response = memCache.get(key);
	if(response) {
		return JSON.parse(JSON.stringify(response));
	}
	else {
		return [];
	}
}


// to cache user data (not urls and responses)
let cacheData = (keyStr, data) => {
	let key = "__cached__"+keyStr;
	let response = memCache.get(key);
	if(response!=null) {
		let dataArr = JSON.parse(JSON.stringify(response));
		data.forEach((dataItem) => {
			if(response.indexOf(dataItem) === -1)
				response.push(dataItem);
		})
		memCache.put(key, response, duration*1000);
	} else {
		memCache.put(key, data, duration*1000);
	}
}


// to get cached URL data
let httpget = (url) => {
	let key = "__cached__"+url;
	let response = memCache.get(key);
	if(response) {
		return new Promise((resolve) => {
			resolve(JSON.parse(response));
		})
	}
	else {
		return new Promise((resolve) => {
			axios.get(url)
				.then((response1) => {
					memCache.put(key, JSON.stringify(response1.data), duration*1000);
					resolve(JSON.parse(JSON.stringify(response1.data)));
				})
				.catch((error1) => {
					throw error1;
				})
		})
	}
}


// get all the keys in cache
let getkeys = () => {
	console.log(memCache.keys());
}

module.exports = {httpget, getkeys, getData, cacheData}; 