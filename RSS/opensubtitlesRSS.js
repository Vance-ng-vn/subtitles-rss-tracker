const got = require('got').default;
const db = require('../modules/bettersqlite3');
const RSS_URL = require('../configs').RSS_URL;

const MINUTE = 60 * 1000;

const RSS = {
    movie: [],
    series: []
}

async function fetchRSS(url) {
    try {
        const type = url.split('/').pop();

        const res = await got.get(url).catch(err => console.error('RSS Fail to get:', url));

        if(res?.body) {
            const fetch = JSON.parse(res.body);

            if(fetch.length) {
                //save to db
                const insert_many = [...fetch].map(item => Object.values(item));
                db.InsertMany(db.Tables.Opensubtitles, ['id', 'sub_id', 'lang_code', 'title', 'ai_translated', 'from_trusted', 'uploader_id'], insert_many);
    
                switch(type) {
                    case 'movie': RSS.movie = fetch; break;
                    case 'tvshow': RSS.series = fetch; break;
                }
            }
        }        
    }
    catch(err) {
        console.error(err);
    }
}

async function update() {
    await fetchRSS(RSS_URL.Opensubtitles.movie);
    setTimeout(async() => await fetchRSS(RSS_URL.Opensubtitles.series), 1*MINUTE);
}

setInterval(update, 3*MINUTE);

const router = require('express').Router();
router.get('/RSS/:type', (req, res) => {
	try {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		switch(req.params.type) {
			case 'movie': res.send(JSON.stringify(RSS.movie)); break;
			case 'tvshow': res.send(JSON.stringify(RSS.series)); break;
			default: res.send(JSON.stringify([]));
		}
	}
	catch(err) {
		console.error(err);
	}
})

module.exports = router;