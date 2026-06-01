const scrape = require('website-scraper');
const options = {
  urls: ['https://pro.ultrapack3d.com/'],
  directory: './site-clone',
  sources: [
    {selector: 'img', attr: 'src'},
    {selector: 'link[rel="stylesheet"]', attr: 'href'},
    {selector: 'script', attr: 'src'},
  ]
};

scrape(options).then((result) => {
    console.log("Scrape successful", result.length);
}).catch((err) => {
    console.error("Scrape error", err);
});
