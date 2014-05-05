module.exports = function(grunt){

  grunt.loadNpmTasks('grunt-bower-requirejs');

  grunt.initConfig({
    bower: {
      target: {
        rjsConfig: 'require-config.js'
      }
    }
  });

};
