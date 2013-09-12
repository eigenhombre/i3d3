"use strict";
/*global d3 */
/*jslint plusplus: true, white: true */


// Make a well-behaved module a la http://o2js.com/2011/04/24/the-module-pattern/:
if(!i3d3) {
    var i3d3 = {};
}

i3d3 = (function(i3d3, window, undefined) {
    var me = {};

    function select(vec, key) { 
        return _.filter(vec, function (x) { return !_.isUndefined(x[key]); }); 
    }

    function concat_contents(l) {
        return _.flatten(l, _.shallow);
    }

    function combine_values(data) {
        return concat_contents(_.pluck(data, "values"));
    }

    function add_time_delta(t0, delta) {
        var x = new Date();
        x.setTime(t0.getTime() + delta);
        return x;                          
    }

    function doplot(opt) {
        // Initial setup
        var xAxis, yAxis, i, xx, yy, line, xmin, xmax,
            pointsets = _.filter(opt.data, function (e) { return e.type === "points"; }),
            linesets = _.filter(opt.data, function (e) { return e.type === "lines"; }),
            barsets = _.filter(opt.data, function(e) { return e.type === "bars"; }),
            padding = 50,
            allpoints = combine_values(pointsets.concat(linesets)),//FIXME: handle bins for histos
            minhistx = _.min(_.map(barsets, function (e) { return e.range[0]; })),
            maxhistx = _.max(_.map(barsets, function (e) { return e.range[1]; })),
            maxhisty = _.max(_.map(barsets, function (e) { return d3.max(e.bins); })),
            xs_from_points_and_hists = _.flatten([_.pluck(barsets, "range"),
                                                  _.pluck(allpoints, "x")]),
            ys_from_points_and_hists = _.flatten([0, 
                                                  _.pluck(barsets, "bins"),
                                                  _.pluck(allpoints, "y")]),
            xextent = [_.min(xs_from_points_and_hists),
                       _.max(xs_from_points_and_hists)],
            yextent = [_.min(ys_from_points_and_hists),
                       _.max(ys_from_points_and_hists)],
            w = opt.size[0],
            h = opt.size[1],
            dotimes = _.every(xextent, _.isDate),
            xscale = (dotimes ? d3.time.scale : d3.scale.linear)()
              .domain(xextent)
              .range([padding, w - padding]),
            yscale = d3.scale.linear()
              .domain(yextent)
              .range([h - padding, padding]),
            vbars = select(opt.extras, "vbar"),
            hbars = select(opt.extras, "hbar"),
            regions = select(opt.extras, "region"),
            notes = select(opt.extras, "note"),
            lines = select(opt.extras, "line"),
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

        yy = 50;
        xx = 10;
        svg.append("text")
            .attr("class", "label")
            .attr("text-anchor", "end")
            .attr("x", xx)
            .attr("y", yy)
            .text(opt.ylabel)
            .attr('transform',
                  function (d, i, j) { return 'rotate(-90 ' + xx + ', ' + yy + ')'; });


        // Content of plots, in order of z-height. See
        // http://stackoverflow.com/questions/13595175/updating-svg-element-z-index-with-d3

        // Rectangular, colored regions of interest
        _.each(regions, function (v) {
                            svg.append("svg:rect")
                                .attr("x", xscale(v.region.min))
                                .attr("y", yscale(yextent[1]))
                                .attr("width", xscale(v.region.max) - xscale(v.region.min))
                                .attr("height", yscale(yextent[0]) - yscale(yextent[1]))
                                .attr("fill", v.region.color);
        });

        // Draw bars
        for(i=0; i < barsets.length; i++) {
            xmin = barsets[i].range[0];
            xmax = barsets[i].range[1];
            svg.append("g").attr("bars_" + i);
            svg.selectAll("bars_" + i + " rect")
                .data(barsets[i].bins)
                .enter()
                .append("rect")
                 .attr("x", function (d, j) {
                      var x;
                      if(dotimes) {
                          x = add_time_delta(xmin, (xmax-xmin) * j / barsets[i].bins.length);
                      } else {
                          x = xmin + (xmax-xmin) * j / barsets[i].bins.length;
                      }
                      return xscale(x);
                   })
                .attr("y", function (d) { return yscale(d); })
                .attr("fill", barsets[i].color || "grey")
                .attr("stroke", barsets[i].color || "grey")
                .attr("width", (xscale(xmax) - xscale(xmin)) / barsets[i].bins.length - 0.1)
                .attr("height", function (d) { return h - (padding + yscale(d)); })
                .attr("opacity", barsets[i].opacity || 1);
        }

        // Draw point sets
        for(i=0; i < pointsets.length; i++) {
            svg.append("g").attr("points_" + i);
            svg.selectAll("points_" + i + " circle")
                .data(pointsets[i].values)
                .enter()
                .append("circle")
                .attr("cx", function (d, i) { return xscale(d.x); })
                .attr("cy", function (d) { return yscale(d.y); })
                .attr("r", pointsets[i].size || 4)
                .attr("fill", pointsets[i].color || "grey");
        }

        // Draw line sets
        line = d3.svg.line()
            .x(function (d) { return xscale(d.x); })
            .y(function (d) { return yscale(d.y); });

        linesets = _.filter(opt.data, function (e) { return e.type === "lines"; });
        for(i=0; i < linesets.length; i++) {
            svg.append("path")
                .attr("d", line(linesets[i].values))
                .attr("class", "lines_" + i)
                .attr("fill", "none")
                .attr("stroke", linesets[i].color || "grey")
                .attr("stroke-width", linesets[i].width || 1);
        }

        // Horizontal and vertical lines
        _.each(vbars, function (v) {
                          svg.append("svg:line")
                              .attr("x1", xscale(v.vbar.pos))
                              .attr("y1", yscale(yextent[0]))
                              .attr("x2", xscale(v.vbar.pos))
                              .attr("y2", yscale(yextent[1]))
                              .style("stroke", v.vbar.color);
        });

        _.each(hbars, function (v) {
                          svg.append("svg:line")
                              .attr("x1", xscale(xextent[0]))
                              .attr("y1", yscale(v.hbar.pos))
                              .attr("x2", xscale(xextent[1]))
                              .attr("y2", yscale(v.hbar.pos))
                              .style("stroke", v.hbar.color);
        });

        _.each(lines, function (v) {
                          svg.append("svg:line")
                              .attr("x1", xscale(v.line.x0))
                              .attr("y1", yscale(v.line.y0))
                              .attr("x2", xscale(v.line.x1))
                              .attr("y2", yscale(v.line.y1))
                              .style("stroke", v.line.color);
        });

        // Text annotations
        _.each(notes, function (v) {
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
                              .text(v.note.text)
                              .attr("style", v.note.style || "");
        });

        return svg;
    }
    me.plot = doplot;
    me.add_time_delta = add_time_delta;
    return me;

}(i3d3, this));
