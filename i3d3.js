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
        return _.flatten(l, "shallow");
    }

    function combine_values(data) {
        return concat_contents(_.pluck(data, "values"));
    }

    function add_time_delta(t0, delta) {
        var x = new Date();
        x.setTime(t0.getTime() + delta);
        return x;                          
    }

    function existy(x) { return x != null; };   // Michael Fogus, "Functional JavaScript"

    function get_y_extent(barsets, pointsets, linesets, do_y_log, min_log_y) {
        function min_max_for_bin(barsets, iset, ibin) {
            if(barsets[iset].errors) {
                return [barsets[iset].bins[ibin] -
                        barsets[iset].errors[ibin][0],
                        barsets[iset].bins[ibin] + 
                        barsets[iset].errors[ibin][1]];
            } else {
                return [barsets[iset].bins[ibin],
                        barsets[iset].bins[ibin]];
            }
        }
        // Histogram min/max, including error bars:
        var bin_min_max_pairs = concat_contents(_.map(
            _.range(barsets.length), function(iset) {
                return _.map(_.range(barsets[iset].bins.length), function(ibin) {
                                 return min_max_for_bin(barsets, iset, ibin);
                             });
            }));

        var hi_bins = _.map(bin_min_max_pairs, _.first);
        var lo_bins = _.map(bin_min_max_pairs, _.last);

        // Points min/max
        var all_point_ys = _.pluck(concat_contents(_.pluck(pointsets, "values")), "y");

        // Lines min/max
        var all_line_ys = _.pluck(concat_contents(_.pluck(linesets, "values")), "y");
        var everything = concat_contents([hi_bins, lo_bins, all_point_ys, all_line_ys]);
        var min = _.min(everything);
        var max = _.max(everything);
        
        return [do_y_log ? min_log_y : min, max];
    }

    function get_x_extent(barsets, pointsets, linesets) {
        var allpoints = combine_values(pointsets.concat(linesets));
        var xs_from_points_and_hists = _.flatten([_.pluck(barsets, "range"),
                                                  _.pluck(allpoints, "x")]);
        return [_.min(xs_from_points_and_hists),
                _.max(xs_from_points_and_hists)];
    }

    function doplot(opt) {
        // Initial setup
        var xAxis, yAxis, i, xx, yy, line, xmin, xmax, zoom,
            pointsets = _.filter(opt.data, function (e) { return e.type === "points"; }),
            linesets = _.filter(opt.data, function (e) { return e.type === "lines"; }),
            barsets = _.filter(opt.data, function(e) { return e.type === "bars"; }),
            padding_left = existy(opt.padding_left) && opt.padding_left || 50,
            padding_right = existy(opt.padding_right) && opt.padding_right || 8,
            padding_bottom = existy(opt.padding_bottom) && opt.padding_bottom || 50,
            padding_top = existy(opt.padding_top) && opt.padding_top || 8,
            minhistx = _.min(_.map(barsets, function (e) { return e.range[0]; })),
            maxhistx = _.max(_.map(barsets, function (e) { return e.range[1]; })),
            maxhisty = _.max(_.map(barsets, function (e) { return d3.max(e.bins); })),
            min_log_y = 0.5,
            do_y_log = opt.yscale == "log",
            yextent = get_y_extent(barsets, pointsets, linesets, do_y_log, min_log_y),
            xextent = get_x_extent(barsets, pointsets, linesets),
            w = opt.size[0],
            h = opt.size[1],
            dotimes = _.every(xextent, _.isDate),
            xscale = (dotimes ? d3.time.scale : d3.scale.linear)()
              .domain(xextent)
              .range([padding_left, w - padding_right]),
            yscale = (do_y_log ? d3.scale.log : d3.scale.linear)()
              .domain(yextent)
              .range([h - padding_bottom, padding_top]),
            vbars = select(opt.extras, "vbar"),
            hbars = select(opt.extras, "hbar"),
            regions = select(opt.extras, "region"),
            notes = select(opt.extras, "note"),
            lines = select(opt.extras, "line"),
            zoomopt = opt.zoom || "x",
            svg = d3.select("#" + opt.div).append("svg")
              .attr("width", w)
              .attr("height", h);

        var x_for_bin = function(nbins, xmin, xmax, j) {
            var x;
            if(dotimes) {
                x = add_time_delta(xmin, (xmax-xmin) * j / nbins);
            } else {
                x = xmin + (xmax-xmin) * j / nbins;
            }
            return xscale(x);                
        };

        // Set up axes
        xAxis = d3.svg.axis()
                      .scale(xscale)
                      .orient("bottom")
                      .ticks(5)
                      .tickFormat(dotimes ? d3.time.format("%H:%M") : undefined);

        yAxis = d3.svg.axis()
                      .scale(yscale)
                      .orient("left")
                      .ticks(3);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (h - padding_bottom) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + padding_left + ",0)")
            .call(yAxis);

        // Set up axis labels

        svg.append("text")
            .attr("class", "label")
            .attr("text-anchor", "end")
            .attr("x", w - padding_right + 5)
            .attr("y", h - 10)
            .attr("style", opt.label_style || "")
            .text(opt.xlabel);

        yy = 50;
        xx = 10;
        svg.append("text")
            .attr("class", "label")
            .attr("text-anchor", "end")
            .attr("x", xx)
            .attr("y", yy)
            .text(opt.ylabel)
            .attr("style", opt.label_style || "")
            .attr('transform',
                  function (d, i, j) { return 'rotate(-90 ' + xx + ', ' + yy + ')'; });


        if(opt.title) {
            svg.append("text")
                .attr("class", "title")
                .attr("x", w/2)
                .attr("y", padding_top - 10)
                .text(opt.title);
        }

        var clip = svg.append("clipPath")
            .attr("id", "clip_" + opt.div)
            .append("rect")
            .attr("x", padding_left)
            .attr("y", padding_top)
            .attr("width", w - (padding_left + padding_right))
            .attr("height", h - (padding_top + padding_bottom));

        var chartBody = svg.append("g").attr("clip-path", "url(#clip_" + opt.div + ")");

        // Add rectangular, colored regions of interest
        _.each(regions, function (v, i) {
            chartBody.append("svg:rect")
                .attr("id", "region-" + opt.div + "-" + i);
        });

        // Histograms ("barsets")
        _.each(barsets, function(barset, i) {
           _.each(barset.bins, function(bar, j) {
               chartBody.append("rect")
                   .attr("id", "bar-" + opt.div + "-" + i + "-" + j);
           });        
           _.each(barset.errors, function(barerr, j) {
               chartBody.append("line")
                   .attr("id", "bar-error-" + opt.div + "-" + i + "-" + j);
           });
        });

        // Linesets
        _.each(linesets, function(lineset, i) {
           chartBody.append("path")
               .attr("id", "path-" + opt.div + "-" + i);
           _.each(lineset.errors, function(lineerr, j) {
               chartBody.append("line")
                   .attr("id", "line-error-" + opt.div + "-" + i + "-" + j);
           });
        });

        // Pointsets
        _.each(pointsets, function(pointset, i) {
            _.each(pointset.values, function(point, j) {
               chartBody.append("circle")
                   .attr("id", "point-" + opt.div + "-" + i + "-" + j);
            });
           _.each(pointset.errors, function(pointerr, j) {
               chartBody.append("line")
                   .attr("id", "point-error-" + opt.div + "-" + i + "-" + j);
           });
        });

        // Add vertical bars
        _.each(vbars, function (v, i) {
            chartBody.append("line")
                       .attr("id", "vbar-" + opt.div + "-" + i);
        });

        // Add horizontal bars
        _.each(hbars, function (v, i) {
            chartBody.append("line")
                       .attr("id", "hbar-" + opt.div + "-" + i);
        });

        // Add (potentially) diagonal lines
        // (data, not display, coordinates)
        _.each(lines, function (v, i) {
            chartBody.append("line")
                       .attr("id", "line-" + opt.div + "-" + i);
        });

        // Text annotations - these do not zoom/scroll
        _.each(notes, function (v) {
                          var X, Y;
                          if(v.note.units === "pixels") {
                              X = v.note.x;
                              Y = v.note.y;
                          } else {
                              // FIXME: Handle zoom transformation
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

        function draw() {
            // Render axes
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            // Render regions
            _.each(regions, function(r, i) {
                 chartBody.select("#region-" + opt.div + "-" + i)
                           .attr("x", xscale(r.region.min))
                           .attr("y", padding_top)
                           .attr("width", xscale(r.region.max) - xscale(r.region.min))
                           .attr("height", h)
                           .attr("fill", r.region.color);
            });

            // Render histograms
            _.each(barsets, function(barset, i) {
                xmin = barset.range[0];
                xmax = barset.range[1];
                _.each(barset.bins, function(bin, j) {
                    if(do_y_log && bin === 0) {
                        return;
                    }
                    chartBody.select("#bar-" + opt.div + "-" + i + "-" + j)
                       .attr("x", x_for_bin(barset.bins.length, xmin, xmax, j))
                       .attr("y", yscale(bin))
                       .attr("fill", barset.color || "grey")
                       .attr("width", Math.max(0, ((xscale(xmax) - xscale(xmin)) / barset.bins.length - 0.1)))
                       .attr("height", Math.max(0, h - (padding_bottom + yscale(bin))))
                       .attr("stroke", barset.color || "grey")
                       .attr("opacity", barset.opacity || 1);
                });
                _.each(barset.errors, function(bin_error, j) {
                    chartBody.select("#bar-error-" + opt.div + "-" + i + "-" + j)
                        .attr("x1", x_for_bin(barset.bins.length, xmin, xmax, j + 0.5))
                        .attr("x2", x_for_bin(barset.bins.length, xmin, xmax, j + 0.5))
                        .attr("y1", yscale(Math.max(do_y_log ? min_log_y : 0, barset.bins[j] - bin_error[0])))
                        .attr("y2", yscale(barset.bins[j] + bin_error[1]))
                        .style("stroke", barset.error_color || "grey");
                });
            });

            line = d3.svg.line()
                .x(function (d) { return xscale(d.x); })
                .y(function (d) { return yscale(d.y); });

            // Render linesets
            _.each(linesets, function(lineset, i) {
                chartBody.select("#path-" + opt.div + "-" + i)
                    .attr("d", line(lineset.values))
                    .attr("fill", "none")
                    .attr("stroke", lineset.color || "grey")
                    .attr("stroke-width", lineset.width || 1);
                _.each(lineset.errors, function(line_error, j) {
                    chartBody.select("#line-error-" + opt.div + "-" + i + "-" + j)
                        .attr("x1", xscale(lineset.values[j].x))
                        .attr("x2", xscale(lineset.values[j].x))
                        .attr("y1", yscale(Math.max(do_y_log ? 1 : 0, lineset.values[j].y - line_error[0])))
                        .attr("y2", yscale(Math.max(lineset.values[j].y + line_error[1])))
                        .style("stroke", lineset.error_color || "grey");
                });
            });
            
            // Render pointsets
            _.each(pointsets, function(pointset, i) {
                _.each(pointset.errors, function(point_error, j) {
                    chartBody.select("#point-error-" + opt.div + "-" + i + "-" + j)
                        .attr("x1", xscale(pointset.values[j].x))
                        .attr("x2", xscale(pointset.values[j].x))
                        .attr("y1", yscale(Math.max(do_y_log ? 1 : 0, pointset.values[j].y - point_error[0])))
                        .attr("y2", yscale(Math.max(pointset.values[j].y + point_error[1])))
                        .style("stroke", pointset.error_color || "grey");
                });
                _.each(pointset.values, function(point, j) {
                    chartBody.select("#point-" + opt.div + "-" + i + "-" + j)
                    .attr("cx", xscale(point.x))
                    .attr("cy", yscale(point.y))
                    .attr("r", pointset.size || 4)
                    .attr("fill", pointset.color || "grey");
                });
            });

            // Render vertical bars
            _.each(vbars, function(v, i) {
                 chartBody.select("#vbar-" + opt.div + "-" + i)
                      .attr("x1", xscale(v.vbar.pos))
                      .attr("y1", padding_top)
                      .attr("x2", xscale(v.vbar.pos))
                      .attr("y2", h + padding_top)
                      .style("stroke", v.vbar.color);                                              
            });

            // Render horizontal bars
            _.each(hbars, function(h, i) {
                 chartBody.select("#hbar-" + opt.div + "-" + i)
                      .attr("x1", padding_left)
                      .attr("y1", yscale(h.hbar.pos))
                      .attr("x2", padding_left + w)
                      .attr("y2", yscale(h.hbar.pos))
                      .style("stroke", h.hbar.color);                                              
            });

            // Render diagonal lines
            _.each(lines, function(l, i) {
                 chartBody.select("#line-" + opt.div + "-" + i)
                      .attr("x1", xscale(l.line.x0))
                      .attr("y1", yscale(l.line.y0))
                      .attr("x2", xscale(l.line.x1))
                      .attr("y2", yscale(l.line.y1))
                      .style("stroke", l.line.color);                                              
            });

        }

        draw();

        // Wire in zoom behavior:
        if(zoomopt != "none") {
            zoom = d3.behavior.zoom();
            if(zoomopt === "both" || zoomopt === "x") {
                zoom = zoom.x(xscale);
            }
            if(zoomopt === "both" || zoomopt === "y") {
                zoom = zoom.y(yscale);
            }
            zoom = zoom.on("zoom", draw);
            // Restrict zoom action to display box (non-axis part) only:
            svg.append("svg:rect")
                .attr("class", "pane")
                .attr("width", w - (padding_left + padding_right))
                .attr("height", h - (padding_top + padding_bottom))
                .attr("cursor", "move")
                .attr("fill", "none")
                .attr("pointer-events", "all")
                .attr("x", padding_left)
                .attr("y", padding_top)
                .call(zoom);
        }

        return svg;
    }
    me.plot = doplot;
    me.add_time_delta = add_time_delta;
    me.existy = existy; // FIXME: put this somewhere else?
    return me;

}(i3d3, this));
