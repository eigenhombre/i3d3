require.config({
  urlArgs: "bust=" + (new Date()).getTime(),
  shim: {
    d3: {
      exports: "d3"
    },
    underscore: {
      exports: "_"
    }
  },
  paths: {
    i3d3: "i3d3",
    underscore: "bower_components/underscore/underscore",
    d3: "bower_components/d3/d3"
  }
});

require(["i3d3"], function(){
  require(["i3d3-demo"]);
});
