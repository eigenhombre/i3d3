function bars(opt) {
    var xAxis, yAxis,
        padding = 50,
        dataset = opt.data[0],
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

    svg.selectAll("rect")
       .data(dataset)
       .enter()
       .append("rect")
       .attr("x", function(d, i) { return binscale(i) ; })
       .attr("y", function(d) { return yscale(d); })
       .attr("fill", "grey")
       .attr("width", w / dataset.length - 0.1)
       .attr("height", function(d) { return h - (padding + yscale(d)); });

    xAxis = d3.svg.axis().scale(xscale).orient("bottom").ticks(5);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    yAxis = d3.svg.axis().scale(yscale).orient("left").ticks(3);
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

    if(! opt.extras) {
        opt.extras = [];
    }
    function select(vec, key) { 
        return vec.filter(function(x) { return x[key] !== undefined; }); 
    }
    var vbars = select(opt.extras, "vbar");
    var hbars = select(opt.extras, "hbar");
    vbars.map(function(v) {
                  svg.append("svg:line")
                      .attr("x1", xscale(v.vbar.pos))
                      .attr("y1", yscale(d3.max(dataset)))
                      .attr("x2", xscale(v.vbar.pos))
                      .attr("y2", yscale(d3.min(dataset)))
                      .style("stroke", v.vbar.color);
    });
    hbars.map(function(v) {
                  svg.append("svg:line")
                      .attr("x1", xscale(xmin))
                      .attr("y1", yscale(v.hbar.pos))
                      .attr("x2", xscale(xmax))
                      .attr("y2", yscale(v.hbar.pos))
                      .style("stroke", v.hbar.color);
    });
}
