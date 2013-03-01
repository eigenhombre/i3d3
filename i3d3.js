function select(vec, key) { 
    return vec.filter(function(x) { return x[key] !== undefined; }); 
}

function bars(opt) {
    // Initial setup
    var xAxis, yAxis,
        padding = 50,
        dataset = opt.data[0].bins,
        xmin = opt.range[0],
        xmax = opt.range[1],
        w = opt.size[0],
        h = opt.size[1],
        binscale = d3.scale.linear()
          .domain([0, dataset.length])
          .range([padding, w - padding]),
        xscale = d3.scale.linear()
          .domain([xmin, xmax])
          .range([padding, w - padding]),
        yscale = d3.scale.linear()
          .domain([0, d3.max(dataset)])
          .range([h - padding, padding]),
        svg = d3.select("#" + opt.div).append("svg")
          .attr("width", w)
          .attr("height", h);

    // Set up axes
    xAxis = d3.svg.axis().scale(xscale).orient("bottom").ticks(5);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    yAxis = d3.svg.axis().scale(yscale).orient("left").ticks(3);

    // Set up axis labels
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", w - padding + 5)
        .attr("y", h - 10)
        .text(opt.xlabel);

    var yy = 50;
    var xx = 10;
    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", xx)
        .attr("y", yy)
        .text(opt.ylabel)
        .attr('transform',
              function(d,i,j) { return 'rotate(-90 ' + xx + ', ' + yy + ')' });

    // Set up extra elements for plots
    if(! opt.extras) {
        opt.extras = [];
    }

    var vbars = select(opt.extras, "vbar");
    var hbars = select(opt.extras, "hbar");
    var regions = select(opt.extras, "region");
    var notes = select(opt.extras, "note");
    var lines = select(opt.extras, "line");

    // Content of plots, in order of z-height. See
    // http://stackoverflow.com/questions/13595175/updating-svg-element-z-index-with-d3

    // Rectangular, colored regions of interest
    regions.map(function(v) {
                  svg.append("svg:rect")
                        .attr("x", xscale(v.region.min))
                        .attr("y", yscale(d3.max(dataset)))
                        .attr("width", xscale(v.region.max) - xscale(v.region.min))
                        .attr("height", yscale(0) - yscale(d3.max(dataset)))
                        .attr("fill", v.region.color);
    });

    // Actual bins
    svg.selectAll("rect")
       .data(dataset)
       .enter()
       .append("rect")
       .attr("x", function(d, i) { return binscale(i) ; })
       .attr("y", function(d) { return yscale(d); })
       .attr("fill", opt.data[0].color && opt.data[0].color || "grey")
       .attr("width", w / dataset.length - 0.1)
       .attr("height", function(d) { return h - (padding + yscale(d)); });

    // Horizontal and vertical lines
    vbars.forEach(function(v) {
                      svg.append("svg:line")
                          .attr("x1", xscale(v.vbar.pos))
                          .attr("y1", yscale(d3.max(dataset)))
                          .attr("x2", xscale(v.vbar.pos))
                          .attr("y2", yscale(d3.min(dataset)))
                          .style("stroke", v.vbar.color);
    });
    hbars.forEach(function(v) {
                      svg.append("svg:line")
                          .attr("x1", xscale(xmin))
                          .attr("y1", yscale(v.hbar.pos))
                          .attr("x2", xscale(xmax))
                          .attr("y2", yscale(v.hbar.pos))
                          .style("stroke", v.hbar.color);
    });
    notes.forEach(function(v) {
                      var X, Y;
                      if(v.note.units === "pixels") {
                          X = v.note.x;
                          Y = v.note.y;
                      } else {
                          X = xscale(v.note.x);
                          Y = yscale(v.note.y);
                      }
                      svg.append("text")
                          .attr("class", "note")
                          .attr("x", X)
                          .attr("y", Y)
                          .attr("stroke", v.note.color)
                          .text(v.note.text);
    });
    lines.forEach(function(v) {
                      svg.append("svg:line")
                          .attr("x1", xscale(v.line.x0))
                          .attr("y1", yscale(v.line.y0))
                          .attr("x2", xscale(v.line.x1))
                          .attr("y2", yscale(v.line.y1))
                          .style("stroke", v.line.color);
    });

    return svg;
}


function points(opt) {
    // Initial setup
    var xAxis, yAxis, i,
        padding = 50,
        dataset = opt.data[0].values,
        allpoints = [].concat.apply([], opt.data.map(function(e) { return e.values; })),
        xextent = d3.extent(allpoints, function(d) { return d.x }),
        yextent = d3.extent(allpoints, function(d) { return d.y }),

        w = opt.size[0],
        h = opt.size[1],
        xscale = d3.scale.linear()
          .domain(xextent)
          .range([padding, w - padding]),
        yscale = d3.scale.linear()
          .domain(yextent)
          .range([h - padding, padding]),
        svg = d3.select("#" + opt.div).append("svg")
          .attr("width", w)
          .attr("height", h);

    // Set up axes
    xAxis = d3.svg.axis().scale(xscale).orient("bottom").ticks(5);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    yAxis = d3.svg.axis().scale(yscale).orient("left").ticks(3);

    // Set up axis labels
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);

    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", w - padding + 5)
        .attr("y", h - 10)
        .text(opt.xlabel);

    var yy = 50;
    var xx = 10;
    svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", xx)
        .attr("y", yy)
        .text(opt.ylabel)
        .attr('transform',
              function(d,i,j) { return 'rotate(-90 ' + xx + ', ' + yy + ')' });

    // Actual data points
    var pointsets = opt.data.filter(function (e) { return e.type === "points"; });
    for(i=0; i < pointsets.length; i++) {
        svg.append("g").attr("points_" + i);
        svg.selectAll("points_" + i + " circle")
            .data(pointsets[i].values)
            .enter()
            .append("circle")
            .attr("cx", function(d, i) { return xscale(d.x); })
            .attr("cy", function(d) { return yscale(d.y); })
            .attr("r", pointsets[i].size && pointsets[i].size || 4)
            .attr("fill", pointsets[i].color && pointsets[i].color || "grey");
    }

    var line = d3.svg.line()
        .x(function(d) { return xscale(d.x); })
        .y(function(d) { return yscale(d.y); });

    var linesets = opt.data.filter(function (e) { return e.type === "lines"; });
    for(i=0; i < linesets.length; i++) {
        svg.append("path")
            .attr("d", line(linesets[i].values))
            .attr("class", "lines_" + i)
            .attr("fill", "none")
            .attr("stroke", linesets[i].color && linesets[i].color || "grey")
            .attr("stroke-width", linesets[i].width && linesets[i].width || 1);
        l = linesets[0];
    }
}
