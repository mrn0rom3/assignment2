/* ========================================================
       Part 3: Weather Forecast (Ajax + XML)
       Fetches S2.xml, then builds a weekly forecast table.
       ======================================================== */

    /* Column order of the table header.
       Index 0 = "Mon" (the first DATA column, after the Date column).
       We use this array to decide WHICH weekday column a forecast
       belongs in, so the record lands under the correct heading. */
    var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    /* Short month names. Index matches the month NUMBER, so position 0
       is left blank and MONTHS[2] === "Feb". This lets the date cell
       read "22 Feb" instead of "22 2". */
    var MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    /* Text colour per weather type, keyed by the <overallCode> value.
       These are the exact colours the brief lists:
         cloudy=blue, thunderstorm=orange, rain=lime,
         sunny & partlySunny = red. Using a lookup object keeps the
       mapping in one spot and avoids a long if/else chain. */
    var WEATHER_COLOUR = {
        cloudy: "blue",
        thunderstorm: "orange",
        rain: "lime",
        sunny: "red",
        partlySunny: "red"
    };

    /* window.onload fires only AFTER the whole page (the table
       skeleton) exists. We start the Ajax request here so the
       elements we are about to fill (forecastBody, forecastTitle)
       are guaranteed to be in the DOM already. */
    window.onload = function () {
        var xhr = new XMLHttpRequest();          // the Ajax object

        /* This callback runs every time the request's state changes.
           We only act on the FINAL state. */
        xhr.onreadystatechange = function () {
            /* readyState 4 = request DONE.
               status 200 = HTTP success (when served by a web server).
               status 0  = success for a local file:// load (no HTTP
                           status exists off a web server) - checking
                           both is the defensive bit that lets the page
                           work opened directly AND via a server. */
            if (xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 0)) {
                buildForecast(xhr.responseXML);  // responseXML = parsed DOM
            }
        };

        /* open(method, url, async):
           "GET" because we are only reading; RELATIVE url
           "data/S2.xml" (brief requires relative links) so it loads
           from the data/ subfolder next to this page; true =
           asynchronous (does not freeze the page). */
        xhr.open("GET", "data/S2.xml", true);
        xhr.send();                               // fire the request
    };

    /* Build the title and all forecast rows from the parsed XML doc.
       Parameter "xml" is the XMLDocument returned in responseXML. */
    function buildForecast(xml) {
        var root = xml.getElementsByTagName("forecast")[0];  // the single root

        /* Read the queryTime ATTRIBUTE off the root and put it in the
           title. getAttribute (not getElementsByTagName) because
           queryTime is an attribute, not a child element.
           The "if" guards against a missing attribute. */
        var queryTime = root.getAttribute("queryTime");
        if (queryTime) {
            document.getElementById("forecastTitle").innerHTML =
                "Singapore [" + queryTime + "]";
        }

        /* Collect every <weather> node, then copy each into a plain
           JS object. Working with simple objects (not live DOM nodes)
           makes the sort below easier to reason about. */
        var nodes = xml.getElementsByTagName("weather");
        var list = [];
        for (var i = 0; i < nodes.length; i++) {
            list.push(readWeather(nodes[i]));
        }

        /* Sort by full date, LATEST first (descending) - a brief
           requirement. dateValue() turns each record into a single
           comparable number; b - a gives descending order. */
        list.sort(function (a, b) {
            return dateValue(b) - dateValue(a);
        });

        /* Clear the body (defensive: safe even if called twice) then
           append one row per forecast in the sorted order. */
        var body = document.getElementById("forecastBody");
        body.innerHTML = "";
        for (var j = 0; j < list.length; j++) {
            body.appendChild(buildRow(list[j]));
        }
    }

    /* Helper: read the text inside a child element of a <weather> node.
       getElementsByTagName(tag)[0] = the first matching child;
       .firstChild.nodeValue = the text node's actual string value.
       (In the XML DOM, element text lives in a child "text node".) */
    function getText(node, tag) {
        return node.getElementsByTagName(tag)[0].firstChild.nodeValue;
    }

    /* Convert one <weather> DOM node into a flat object so the rest of
       the code works with plain properties like w.year, w.highest. */
    function readWeather(node) {
        return {
            year: getText(node, "year"),
            month: getText(node, "month"),
            date: getText(node, "date"),
            dayOfWeek: getText(node, "dayOfWeek"),
            overall: getText(node, "overall"),
            overallCode: getText(node, "overallCode"),
            highest: getText(node, "highest"),
            lowest: getText(node, "lowest")
        };
    }

    /* Turn a record into one comparable number in YYYYMMDD form, e.g.
       2026-07-09 -> 20260709. Multiplying year by 10000 and month by
       100 keeps the digits in the right place so numeric comparison
       equals chronological comparison. Number() converts the XML text
       ("2026") into an actual number first. */
    function dateValue(w) {
        return (Number(w.year) * 10000) +
               (Number(w.month) * 100) +
               Number(w.date);
    }

    /* Build one table ROW: the yellow Date cell, then seven weekday
       cells. Only the cell matching this record's dayOfWeek gets
       filled; the other six stay blank - that is what produces the
       scattered, calendar-like layout in the sample. */
    function buildRow(w) {
        var tr = document.createElement("tr");

        /* First column = the date, on a YELLOW background
           (brief: first column is yellow). Shows "date Month". */
        var dateCell = document.createElement("td");
        dateCell.style.cssText =
            "border: 1px solid; padding: 6px; background: yellow; text-align: center;";
        dateCell.innerHTML = w.date + " " + MONTHS[Number(w.month)];
        tr.appendChild(dateCell);

        /* Seven day columns. vertical-align: top keeps the content
           pinned to the top of tall rows so columns line up neatly. */
        for (var d = 0; d < DAYS.length; d++) {
            var cell = document.createElement("td");
            cell.style.cssText =
                "border: 1px solid; padding: 6px; text-align: center; vertical-align: top;";

            /* Fill ONLY the column whose heading equals this record's
               day of week; all other cells are left empty. */
            if (DAYS[d] === w.dayOfWeek) {
                cell.innerHTML = buildCellContent(w);
            }
            tr.appendChild(cell);
        }
        return tr;
    }

    /* Build the inner HTML of a FILLED cell: temperature line, weather
       image, then the coloured description. */
    function buildCellContent(w) {
        /* Look up the colour by overallCode. The "|| black" is
           defensive: if the XML ever had an unknown code, we still
           render readable black text instead of nothing. */
        var colour = WEATHER_COLOUR[w.overallCode] || "black";

        /* Temperature HIGHEST to LOWEST (brief) with the degree symbol.
           &deg; is the HTML entity for the degree sign. */
        var temp = w.highest + "&deg; - " + w.lowest + "&deg;";

        /* Weather image chosen by overallCode using a RELATIVE link
           (brief) into the img/ subfolder. The file names must match
           the overallCode values exactly, e.g. overallCode "cloudy"
           -> img/cloudy.jpeg.
           The alt text is a defensive fallback if an image is missing. */
        var img = "<img src='img/" + w.overallCode + ".jpeg' alt='" +
                  w.overallCode + "' width='48' height='48'>";

        /* Description text, coloured per the weather type. */
        var text = "<span style='color: " + colour + ";'>" + w.overall + "</span>";

        /* Stack the three pieces vertically with <div>s. */
        return "<div>" + temp + "</div>" +
               "<div>" + img + "</div>" +
               "<div>" + text + "</div>";
    }