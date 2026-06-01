import scrape from 'website-scraper';

const options = {
  urls: ['https://pro.ultrapack3d.com/'],
  directory: './site-clone',
};

scrape(options).then((result) => {
    console.log("Scrape successful");
}).catch((err) => {
    console.error("Scrape error", err);
});
