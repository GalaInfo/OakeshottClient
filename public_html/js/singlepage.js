var endpointGET = 'http://localhost:7200/repositories/oto';// endpoint for GET requests to GraphBD
var endpointPOST = 'http://localhost:7200/repositories/oto/statements';// endpoint for POST requests to GraphBD

//makes an ajax GET request towards endpointUrl containing sparqlQuery, when finished doneCallback is called
function makeSPARQLQuery(endpointUrl, sparqlQuery, doneCallback) {
    var settings = {
        headers: {Accept: 'application/sparql-results+json'},
        data: {query: sparqlQuery}
    };
    return $.ajax(endpointUrl, settings).then(doneCallback);
}

//makes an ajax POST request towards endpointUrl containing sparqlQuery, when finished doneCallback is called
function makeSPARQLUpdate(endpointUrl, sparqlQuery, doneCallback) {
    var settings = {
        headers: {Accept: 'application/sparql-results+json'},
        data: {update: sparqlQuery},
        method: "POST"
    };
    return $.ajax(endpointUrl, settings).then(doneCallback);
}

//gets the list of countries from wikidata
function countries() {
    var countryList = [];
    var endpointUrl = 'https://query.wikidata.org/sparql';
    var sparqlQuery = "SELECT ?Stato_sovranoLabel WHERE {\n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". }\n" +
            "  ?Stato_sovrano wdt:P31 wd:Q3624078.\n" +
            "}";

    makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
        $.each(data.results.bindings, function (i, v) {
            countryList.push(v.Stato_sovranoLabel.value);
        });
        template = buildSelect(countryList.sort(), "Any");
        $('select[name="country"]').append(template);
        $('select[name="country"]').selectpicker("refresh");
    });
}

//gets the link to the wikipedia page "Oakeshott typology" and its abstract from dbpedia
function getLink() {
    var endpointUrl = 'https://dbpedia.org/sparql';
    var sparqlQuery = "SELECT ?url ?description WHERE {?id  rdfs:label \"Oakeshott typology\"@en;foaf:isPrimaryTopicOf ?url; dbo:abstract ?description.FILTER(LANG(?description) = \"en\").}";
    makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
        $("#link").prop("href", data.results.bindings[0].url.value);
        $("#description").append(data.results.bindings[0].description.value);
    });
}

//classifies a sword, classification is done with three requests, an insert, a select and a delete to leave a clean environment
function classify(grip, length, pommmel, guard, section, fuller) {
    //INSERT
    var query = buildInsertQuery(grip, length, pommmel, guard, section, fuller);
    makeSPARQLUpdate(endpointPOST, query, function (data) {
        console.log("insert OK");

        //CLASSIFY 
        query = "PREFIX oto: <http://www.semanticweb.org/oakeshott#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX owl: <http://www.w3.org/2002/07/owl#> " +
                "SELECT distinct ?type ?typedesc ?fun where { " +
                "oto:TypeTest a ?typeclass. " +
                "?typeclass oto:typeFunction ?fun. " +
                "?typeclass rdfs:comment ?typedesc. " +
                "{?typeclass rdfs:subClassOf oto:OneHanded} UNION {?typeclass rdfs:subClassOf oto:TwoHanded}. " +
                "filter(?typeclass != oto:OneHanded). " +
                "filter(?typeclass != oto:TwoHanded). " +
                "filter (!isBlank(?typeclass)). " +
                "?typeclass rdfs:label ?type.}";

        makeSPARQLQuery(endpointGET, query, function (data) {
            var res = [];
            if (data.results.bindings[0]) {
                $.each(data.results.bindings, function (i, v) {
                    template = buildClassCard(v.type.value, v.fun.value, v.typedesc.value);
                    res.push(template);
                });
            } else {
                res.push("Not classifiable D:");
            }
            result(res);

            //DELETE
            query = "PREFIX oto: <http://www.semanticweb.org/oakeshott#> " +
                    "DELETE{ " +
                    "oto:HiltTest oto:gripType ?gripType. " +
                    "oto:BladeTest oto:length ?length. " +
                    "oto:HiltTest oto:composedOf ?part." +
                    "oto:BladeTest oto:hasCrossSection ?section. " +
                    "oto:BladeTest oto:hasFuller ?fuller.} " +
                    "WHERE{ " +
                    "oto:HiltTest oto:gripType ?gripType. " +
                    "oto:BladeTest oto:length ?length. " +
                    "oto:HiltTest oto:composedOf ?part. " +
                    "oto:BladeTest oto:hasCrossSection ?section. " +
                    "oto:BladeTest oto:hasFuller ?fuller.}";

            makeSPARQLUpdate(endpointPOST, query, function (data) {
                console.log("reset OK");
            });
        });
    });
}

//search for a specific sword in the graph, all parameters are optional, if none is defined then returns all swords
function search(name, country, minlen, maxlen, fun, pommel, guard, section, fuller, type) {

    query = buildSearchQuery(name, country, minlen, maxlen, fun, pommel, guard, section, fuller, type);
    makeSPARQLQuery(endpointGET, query, function (data) {
        var res = [];
        if (data.results.bindings[0]) {
            $.each(data.results.bindings, function (i, v) {
                template = buildSearchCard(v.name.value, v.country.value, v.type.value, v.function.value, v.pommel.value, v.guard.value, v.section.value, v.fuller.value, v.length.value, v.img.value);
                res.push(template);
            });
        } else {
            res.push("Could not find anything D:");
        }
        result(res);
    });
}

//appends the results to the html page
function result(template) {
    $(".hidden").hide();
    $("#result").empty();
    $.each(template, function (i, v) {
        $("#result").append(v);
    });
}

$(function () {
    getLink();
    countries();

//form submit
    $("#swordClass").submit(function (e) {

        var cgrip = $('select[name="cgrip"]').val();
        var clength = $('input[name="clength"]').val();
        var cpommel = $('input[name="cpommel"]:checked').val();
        var cguard = $('input[name="cguard"]:checked').val();
        var csection = $('input[name="csection"]:checked').val();
        var cfuller = $('input[name="cfuller"]:checked').val();

        e.preventDefault();
        $(".hidden").show();
        classify(cgrip, clength, cpommel, cguard, csection, cfuller);
    });

//form submit
    $("#swordSearch").submit(function (e) {

        var name = $('input[name="name"]').val();
        var minlen = $('input[name="minlength"]').val();
        var maxlen = $('input[name="maxlength"]').val();
        var country = $('select[name="country"]').val();
        var fun = $('select[name="function"]').val();
        var type = $('input[name="type"]:checked').val();
        var spommel = $('input[name="spommel"]:checked').val();
        var sguard = $('input[name="sguard"]:checked').val();
        var ssection = $('input[name="ssection"]:checked').val();
        var sfuller = $('input[name="sfuller"]:checked').val();

        e.preventDefault();
        $(".hidden").show();
        search(name, country, minlen, maxlen, fun, spommel, sguard, ssection, sfuller, type);
    });
});
