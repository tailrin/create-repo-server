require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const fetch = require("node-fetch");
const NODE_ENV = process.env.NODE_ENV
const appName1 = [];
const userName1 = [];
const token = {
	access_token: ""
}
const app = express()
const credentials = {
	client: {
		id: process.env.CLIENT_ID,
		secret: process.env.CLIENT_SECRET
	},
	auth: {
		tokenHost: 'https://github.com',
		tokenPath: '/login/oauth/access_token',
		authorizePath: '/login/oauth/authorize'
	},
	options: { 
		bodyFormat: 'json', 
		authorizationMethod: 'header' 
	}
};
const oauth2 = require('simple-oauth2').create(credentials);
const morganOption = (NODE_ENV === 'production')
	? 'tiny'
	: 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

app.use(function errorHandler(error, req, res, next){
	let response
	if (NODE_ENV === 'production'){
		response = { error: { message: 'server error' } }
	} else {
		console.error(error)
		response = { message: error.message, error }
	}
	res.status(500).json(response)
})

const getToken = async (tokenConfig, httpOptions, res) => {
	try {
		const result = await oauth2.authorizationCode.getToken(tokenConfig, httpOptions);
		console.log(result)
		token.access_token = result.access_token
		res.send('You have been verified please return to the app you called josh-create-node-app from.');
	} catch (error) {
		console.log('Access Token Error', error.message);
	}
	  
}

app.get('/getToken', (req, res) => {
	res.json(token)
})


app.get('/callback', (req, res) => {
	const state = req.query.state;
	const tokenConfig = {
		code: req.query.code,
		redirect_uri: process.env.REDIRECT_URI,
		scope: 'repo', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
	};
	const httpOptions = {};
	getToken(tokenConfig, httpOptions, res)
})



app.get('/', (req, res) => {
	userName1.push(req.params.userName);
	console.log(req.params)
	appName1.push(req.params.appName);


	const authorizationUri = oauth2.authorizationCode.authorizeURL({
		redirect_uri: process.env.REDIRECT_URI,
		scope: 'repo', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
		state: `${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}${Math.random().toString(16).substring(2, 6)}${Math.random().toString(16).substring(2, 6)}${Math.random().toString(16).substring(2, 14)}`
	});
	res.redirect(authorizationUri);
});




module.exports = app
