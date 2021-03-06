const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const url = require('url');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const app = express();

const port = 8080;

const appUrl = 'localhost:4200';
const renderUrl = 'https://render-tron.appspot.com/render';

function generateUrl(request) {
    return url.format({
        //protocol: 'https',
        protocol: request.protocol,
        host: appUrl,
        pathname: request.originalUrl
    });
}

function detectBot(userAgent){
    const bots = [
        'googlebot',
        'adsbot-google',
        'bingbot',
        'yandexbot',
        'teoma',
        'duckduckbot',
        'slurp',
        'baiduspider',
        //Social
        'twitterbot',
        'facebookexternalhit',
        'linkedinbot',
        'embedly',
        'pinterest',
        'W3C_Validator'
    ]

    const agent = userAgent.toLowerCase();
    for (const bot of bots) {
        if (agent.indexOf(bot.toLowerCase()) > -1) {
            console.log('bot detected', bot, agent);
            return true;
        }
    }

    return false;
}

const allowedExt = ['.js','.ico','.css','.png','.jpg','.gif','.woff2','.woff','.ttf','.svg'];

app.get('*', (req, res) => {
    const isBot = detectBot(req.headers['user-agent']);

    if (!isBot) {
        const botUrl = generateUrl(req);
        fetch(`${renderUrl}/${botUrl}`)
            .then(res => res.text())
            .then(body => {
                console.log(botUrl);
                res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
                res.set('Vary', 'User-Agent');
                res.send(body.toString())
            });
    } 
	else {
        if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
            res.sendFile(path.resolve(`public/${req.url}`));
        } else {
            res.sendFile(path.resolve('public/index.html'));
        }
    }
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.raw({ limit: '50mb' }));
app.use(bodyParser.text({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Catch errors
app.on('error', (error) => {
    console.error(moment().format(), 'ERROR', error);
});
  
process.on('uncaughtException', (error) => {
    console.log(moment().format(), error);
});

app.listen(port, () => console.log(`http is started ${port}`));
