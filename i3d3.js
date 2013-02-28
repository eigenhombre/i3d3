function bars(dataset, datarange, xlabel, h, w, target_div) {
    var padding = 40,
        xmin = datarange[0],
        xmax = datarange[1],
        binscale = d3.scale.linear()
          .domain([0, dataset.length])
          .range([padding, w - padding]),
        xscale = d3.scale.linear()
          .domain([xmin, xmax])
          .range([padding, w - padding]),
        yscale = d3.scale.linear()
          .domain([0, d3.max(dataset)])
          .range([h - padding, padding]),
        svg = d3.select("#" + target_div).append("svg")
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

    var xAxis = d3.svg.axis().scale(xscale).orient("bottom").ticks(5);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    var yAxis = d3.svg.axis().scale(yscale).orient("left").ticks(3);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + padding + ",0)")
        .call(yAxis);

    svg.append("text")
        .attr("class", "xlabel")
        .attr("text-anchor", "end")
        .attr("x", w - padding + 5)
        .attr("y", h - 5)
        .text(xlabel);
}
