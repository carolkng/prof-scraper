# UBC Prof Scraper

A hacky script in CasperJS to build a dataset of contact info for relevant UBC pprofessors.

## Installation

Requires [CasperJS](http://docs.casperjs.org/en/latest/installation.html) (doy). Download and start scraping immediately!

## Usage

```
$ casperjs scrape.js [--vars]
```

Currently available variable names:

- `subj`: Subject (e.g. ENGL, FREN, MATH)
- `crsno`: Course number
- `actv`: Activity type (e.g. Lecture, Laboratory)
- `file`: A filename so you can output your results in beautiful CSV

More customisation to come for form fields and other things.

