i3d3
====

[D3](http://d3js.org/)-based histogramming and plotting library (for use in [IceCube](http://icecube.wisc.edu) and other projects).  **This is a work in progress**.

### Examples

The following examples were all created from [this HTML](example.html):

![Example output](example.png "Example output")

### Background

We looked around at 
[quite](https://code.google.com/p/flot/)
[a](http://www.jqplot.com/tests/) 
[few](http://www.highcharts.com/)
JavaScript plotting libraries which might meet our requirements, which are (watch this space for updated status as the project progresses):

#### DONE

- Minimal visual noise
- Histogram / bar graphs based on provided array of bin heights
    - Display X and Y axes, with labels
    - Set color, transparency of histogram
    - Multiple histograms per plot
    - Show X and Y axis labels
    - Single or multiple plots per page, of various sizes
- Scatter / line plots
    - Multiple data sets per page in different colors/widths
    - Histograms and scatter / line plots on same diagram

#### Not done

- Still need to be added to combined plots:
    - Add rectangular highlights to X-ranges underneath histograms
    - Draw horizontal, vertical and other lines on top of plot
    - Add text to plot in either data or display units
- Show (x,y) plot coordinates of mouse
- Wrap everything in an object to avoid namespace pollution
- Log / linear axes
- Error bars
- Time series X-axes
- Show gaps in data
- Zooming / panning
- Exporting data from plot
- Exporting plot graphic (either SVG or PDF would be OK)
- Ability to “reset” the plot (if, for example, zoomed beyond recognition)

None of the canned plotting / graphing packages we looked at were
quite what we wanted; D3.js does not provide these directly but is
sufficiently powerful, flexible and fast to provide a foundation to
allow us to implement these ourselves.

### References

http://stackoverflow.com/questions/6766547/javascript-graphing-library

http://www.amazon.com/Interactive-Data-Visualization-Scott-Murray/dp/1449339735/ref=pd_sim_b_1


### Author

[John Jacobsen](http://eigenhombre.com)
