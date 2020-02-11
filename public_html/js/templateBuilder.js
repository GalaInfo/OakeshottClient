//formats the classify results
function buildClassCard(type, fun, descr) {
    const template = `
                    <div class="row my-4">
                        <div class="col-sm-3">
                            <h2 class="my-4">${type}</h2>
                            <h4>Function: ${fun}</h4>
                        </div>
                        <img class="img-fluid" src="../img/types/${type}.jpg" alt=""/>
                    </div>
                    <div class="row my-4">
                        <p>${descr}</p>
                    </div>
                    <hr>`;
    return template;
}

//formats the search results
function buildSearchCard(name, country, type, fun, pommel, guard, section, fuller, length, img) {
    var template;
    if (img === "None") {
        template = `
                    <div class="row my-4">
                        <div class="col-sm-3">
                            <h2 class="my-4">${name}</h2>
                            <h4 class="my-4">${country}</h4>
                            <h4 class="my-4">${type}</h4>
                            <h4>Function: ${fun}</h4>
                            <h4>Blade length: ${length} cm</h4>
                            <h4>Pommel: ${pommel}</h4>
                            <h4>Guard: ${guard}</h4>
                            <h4>${section}</h4>
                            <h4>${fuller}</h4>
                        </div>
                        <img class="img-fluid" src="../img/types/${type}.jpg" alt=""/>
                    </div>
                    <hr>`;
    } else {
        template = `
                    <div class="row my-4">
                        <div class="col-sm-3">
                            <h2 class="my-4">${name}</h2>
                            <h4 class="my-4">${country}</h4>
                            <h4 class="my-4">${type}</h4>
                            <h4>Function: ${fun}</h4>
                            <h4>Blade length: ${length} cm</h4>
                            <h4>Pommel: ${pommel}</h4>
                            <h4>Guard: ${guard}</h4>
                            <h4>${section}</h4>
                            <h4>${fuller}</h4>
                        </div>
                        <img class="img-fluid" src=${img} alt=""/>
                    </div>
                    <hr>`;
    }
    return template;
}

//builds a select input
function buildSelect(data, defaultValue) {
    var init = "";
    if (defaultValue) {
        init = `<option>${defaultValue}</option>`;
    }
    $.each(data, function (i, v) {
        var opt = `<option>${v}</option>`;

        init += opt;
    });
    return init;
}

//builds an INSERT query
function buildInsertQuery(grip, length, pommmel, guard, section, fuller) {
    var template = `
                    PREFIX oto: <http://www.semanticweb.org/oakeshott#>
                    INSERT{
                        oto:HiltTest oto:gripType ${grip}.
                        oto:BladeTest oto:length ${length}.
                        oto:HiltTest oto:composedOf oto:${pommmel}.
                        oto:HiltTest oto:composedOf oto:${guard}.
                        oto:BladeTest oto:hasCrossSection oto:${section}.
                        oto:BladeTest oto:hasFuller oto:${fuller}.
                    } WHERE{}`;
    return template;
}

//builds a search query by appending a list of FILTERS
function buildSearchQuery(name, country, minlen, maxlen, fun, pommel, guard, section, fuller, type) {
    var filters = [];
    var template = `
                    PREFIX oto: <http://www.semanticweb.org/oakeshott#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    SELECT ?name ?country ?length ?pommel ?guard ?section ?fuller ?type ?function ?img
                    WHERE {
                        ?sword oto:composedOf ?b;
                               oto:composedOf ?p; 
                               oto:composedOf ?g; 
                               oto:name ?name; 
                               oto:isFrom ?c; 
                               oto:hasBladeSection ?s; 
                               oto:hasType ?t;
                               oto:image ?img.
                        ?t a ?typeclass.
                        ?typeclass oto:typeFunction ?function.
                        ?b oto:length ?length. 
                        ?p a oto:Pommel. 
                        ?g a oto:Guard. 
                        ?b oto:hasFuller ?f.
                        ?c rdfs:label ?country.
                        ?p rdfs:label ?pommel.
                        ?g rdfs:label ?guard.
                        ?s rdfs:label ?section.
                        ?f rdfs:label ?fuller.
                        ?typeclass rdfs:label ?type.`;

    if (name) {
        name = name.toLowerCase();
        filters.push(`FILTER(contains(lcase(?name), "${name}")).`);
    }
    if (country !== "Any") {
        country = country.replace(" ", "%20");
        filters.push(`FILTER(?c = oto:${country}).`);
    }
    if (minlen && maxlen) {
        country = country.replace(" ", "%20");
        filters.push(`FILTER(?length >= ${minlen} && ?length <= ${maxlen}).`);
    } else if (minlen) {
        filters.push(`FILTER(?length >= ${minlen} && ?length <= 2000).`);
    } else if (maxlen) {
        filters.push(`FILTER(?length >= 0 && ?length <= ${maxlen}).`);
    } else {
        filters.push(`FILTER(?length >= 0 && ?length <= 2000).`);
    }
    if (fun !== "Any") {
        filters.push(`FILTER(?function = "${fun}"@en).`);
    }
    if (pommel !== "Any") {
        filters.push(`FILTER(?p = oto:${pommel}).`);
    }
    if (guard !== "Any") {
        filters.push(`FILTER(?g = oto:${guard}).`);
    }
    if (section !== "Any") {
        filters.push(`FILTER(?s = oto:${section}).`);
    }
    if (fuller !== "Any") {
        filters.push(`FILTER(?f = oto:${fuller}).`);
    }
    if (type !== "Any") {
        filters.push(`?typeclass rdfs:subClassOf oto:${type}.`);
    }

    filters.push(`}`);
    $.each(filters, function (i, v) {
        template += v;
    });
    return template;
}
