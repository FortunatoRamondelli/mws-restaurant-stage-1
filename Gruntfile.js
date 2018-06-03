module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            width: 300,
            rename: false,
            suffix: '_small',
            quality: 30
          },
          {
            width: 600,
            rename: false,
            suffix: '_medium',
            quality: 30
          },
          {
            width: 800,
            rename: false,
            quality: 30
          }]
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'img_tmp/'
        }]
      }
    },

    webp: {
      files: {
        expand: true,
        cwd: 'img_tmp',
        src: '*.jpg',
        dest: 'img/'
      },
      options: {
        binpath: require('webp-bin').path,
        quality: 30
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img', 'img_tmp'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img', 'img_tmp']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: ['img_src/fixed/*.{gif,jpg,png,svg}'],
          dest: 'img/',
          flatten: true,
        }]
      },
    },

  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-webp');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images', 'webp']);

};