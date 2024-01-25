require('dotenv').config();

let configs = Object();

const BASE_URL = {
    Subscene: process.env.SUBSCENE_URL,
    Opensubtitles: process.env.OPENSUBTITLES_URL
}

configs.RSS_URL = {
    Subscene: {
        movie: BASE_URL.Subscene + '/RSS/film',
        series: BASE_URL.Subscene + '/RSS/series'
    },
    Opensubtitles: {
        movie: BASE_URL.Opensubtitles + '/RSS/movie',
        series: BASE_URL.Opensubtitles + '/RSS/tvshow'
    }
}

module.exports = configs;