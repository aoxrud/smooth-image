/**
@classdesc
*/
angular.module('smooth-image', [])
.service('SmoothImageService', class {
  constructor($window) {

    this.isEnabled = false;
    this.elements = {};
    this.counter = 0;

    if('IntersectionObserver' in window) {
      this.isEnabled = true;
      this.io = new IntersectionObserver(intersections => this.processIntersections(intersections))
    }
  }

  processIntersections(intersections) {
    intersections.forEach(entry => {
      if(entry.isIntersecting) {
        const imageId = entry.target._imageId;
        if(this.elements[imageId]) {
          this.elements[imageId].callback();
        }
      }
    })
  }

  observe(element, callback) {
    if(this.isEnabled) {
      element._imageId = this.counter++;
      this.elements[element._imageId] = {element, callback};
      this.io.observe(element);
    } else {
      callback();
    }
  }

  unobserve(element) {
    if(this.isEnabled) {
      this.io.unobserve(element);
      const imageId = element._imageId;
      delete this.elements[imageId];
    }
  }
})
.component('imageContainer', {
  bindings: {
    image: '@'
  },
  template: `
    <div class='image-container'>
      <div class='background-image'></div>
      <div class='is-preloading'></div>
    </div>
  `,
  controller: class {

    constructor($element, SmoothImageService) {
      this.$el = $element[0];
      this.$bg = this.$el.querySelector('.background-image');
      this.$preload = this.$el.querySelector('.is-preloading');
      this.SmoothImageService = SmoothImageService;
    }

    $onInit() {
      this.$preload.style.opacity = 1;
      this.$bg.style.backgroundImage = `url("${this.image}")`;
    }

    $onDestroy() {
      this.SmoothImageService.unobserve(this.$el);
    }


    $postLink() {
      this.SmoothImageService.observe(this.$el, () => {
        const image = new Image();
        image.src = this.image;

        if(image.complete) {
          this.imageLoaded();
        } else {
          image.onload = () => this.imageLoaded();
        }

        this.SmoothImageService.unobserve(this.$el);
      });
    }

    imageLoaded() {
      this.$preload.style.opacity = 0;
    }
  }
});