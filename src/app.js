require('dotenv').config();
const fetch = require('node-fetch');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const NODE_ENV = process.env.NODE_ENV
const appName1 = [];
const token = {
	access_token: ""
}
const gitUrl = [];
const app = express();
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

const getToken = async (tokenConfig, httpOptions) => {
	try {
		const result = await oauth2.authorizationCode.getToken(tokenConfig, httpOptions);
		token.access_token = result.access_token
	} catch (error) {
		console.log('Access Token Error', error.message);
	}
}

const createGitRepo = () => {
    return new Promise((res, rej) => {
        exec(`curl -H "Authorization: token ${token.access_token}" --data '{"name":"${appName[0]}"}' https://api.github.com/user/repos`, (err, stdout, stderr) => {
            if (err) {
                //some err occurred
                console.error(err);
            } else {
                // the *entire* stdout and stderr (buffered)
                const response = JSON.parse(stdout);
                gitUrl.push(response.clone_url);
            }
            res();
        });
    })
}

const createRepo = async (req, res) => {
	const tokenConfig = {
		code: req.query.code,
		redirect_uri: process.env.REDIRECT_URI,
		scope: 'repo', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
	};
	const httpOptions = {};
	await getToken(tokenConfig, httpOptions);
	await createGitRepo();
	res.json("You have been verified please return to the app your terminal!")
}

app.get('/get-git-url', (req, res) => {
	res.json(gitUrl[0])
})


app.get('/callback', (req, res) => {
	createRepo(req, res);
})



app.get('/', (req, res) => {
	console.log(req.params)
	appName1.push(req.query.appName);
	const authorizationUri = oauth2.authorizationCode.authorizeURL({
		redirect_uri: process.env.REDIRECT_URI,
		scope: 'repo', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
		state: `${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}${Math.random().toString(16).substring(2, 6)}${Math.random().toString(16).substring(2, 6)}${Math.random().toString(16).substring(2, 14)}`
	});
	res.redirect(authorizationUri);
});




module.exports = app
