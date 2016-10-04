/*eslint strict:0*/
/*global CasperError, console, phantom, require*/

var casper = require("casper").create({
    verbose: true
});
var fs = require('fs');

var fileName = "links.csv";

// The base links array
var searchUrl = "http://courses.students.ubc.ca/cs/main?pname=subjarea&tname=sectsearch";
var links = [searchUrl];
var siteRoot = "http://courses.students.ubc.ca";

// Defaults to all first year lectures
var subj = casper.cli.has("subj") ? casper.cli.get("subj") : "",
    crsno = casper.cli.has("crsno") ? casper.cli.get("crsno") : "1*",
    actv = casper.cli.has("actv") ? casper.cli.get("actv") : "Lecture";

// If we don't set a limit, it could go on forever
var upTo = ~~casper.cli.get(0) || 80;

// tries before quitting if it keeps returning empty
var currentTry = 0;
var maxTries = 3;

var currentLink = 0;

function reportErrors(f) {
  var ret = null;
  try {
    ret = f();
  } catch (e) {
    casper.echo("ERROR: " + e);
    casper.exit();
  }
  return ret;
}

// Get the links, and add them to the links array
// (It could be done all in one step, but it is intentionally splitted)
function addLinks(link) {
    this.then(function() {
        var found = this.evaluate(searchLinks);
        this.echo(found.length + " links found on " + link);
        found.length > 0 ? currentLink++ : currentTry++;
        links = links.concat(found);
    });
}

// Fetch all <a> elements from the page and return
// the ones which contains a href starting with 'http://'
function searchLinks() {
    var filter, map;
    filter = Array.prototype.filter;
    map = Array.prototype.map;
    return map.call(filter.call(document.querySelectorAll("a"), function(a) {
        return /^\/cs\/.*pname=inst&.*/i.test(a.getAttribute("href"));
    }), function(a) {
        return a.getAttribute("href");
    });
}

// Just opens the page and prints the title
function startLog(link) {
    var map = Array.prototype.map;
    this.start(link, function() {
        this.echo('Prof name: ' + this.getElementInfo('td+td').html);
        var instrCSV = map.call(
            this.getElementsInfo('td+td').splice(0,3), function(e){
                return e.html.split(", ").join(",");
            });
        var classCSV = map.call(
            link.match(/&(dept|course|section|term)=([A-Z0-9]+)/g),
            function(a) {
                return a.replace(/&.*=/g, "");
            });
        require('utils').dump(classCSV);
        try {
            fs.write(fileName, instrCSV.join(",") + "," + classCSV.join(",") + "\n", 'a');
        } catch(e) {
            casper.log(e, "error");
        }
    });
}

function startSearch(criteria) {
  this.start(searchUrl, function() {
    this.fill('form[name="sect_srch_criteria_simp_search"]', {
      'subj':   criteria.subj,
      'crsno':  criteria.crsno,
      'actv':   criteria.actv
    }, true);
  });
  this.thenOpen(searchUrl + "&scrpg=16&fmat=dtl", function() {
    this.echo("Went to " + searchUrl + "&scrpg=16&fmat=dtl");
  });
}

// As long as it has a next link, and is under the maximum limit, will keep running
function check() {
    var criteria = {
        'subj': subj,
        'crsno': crsno,
        'actv': actv
    };

    if (currentLink === 0 && currentTry < maxTries) {
        this.echo('--- Link ' + currentLink + ' ---');
        startSearch.call(this, criteria);
        addLinks.call(this, links[currentLink]);
        this.run(check);
    } else if (currentLink < links.length && currentLink < upTo) {
        this.echo('--- Link ' + currentLink + ' ---');
        var actualLink = siteRoot + links[currentLink];
        startLog.call(this, actualLink);
        currentLink++;
        this.run(check);
    } else {
        this.echo("All done.");
        this.exit();
    }
}

casper.start().then(function() {
    this.echo("Starting");
});

casper.run(check);
