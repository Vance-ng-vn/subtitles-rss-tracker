const SubsceneRouter = require('./RSS/subsceneRSS');
const OpensubtitlesRouter = require('./RSS/opensubtitlesRSS');

const app = require('express')();

app.use(SubsceneRouter);
app.use(OpensubtitlesRouter);

app.listen(process.env.PORT || 63350);