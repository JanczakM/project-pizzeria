import {Product} from './components/product.js';
import {Cart} from './components/cart.js';
import {Booking} from './components/booking.js';
import {select, settings, classNames} from './settings.js';

const app = {
  activatePage: function(pageId){
    const thisApp = this;

    for(let link of thisApp.navLinks){
      link.classList.toggle(classNames.nav.active, link.getAttribute('href') == '#' + pageId);
    }

    for(let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    window.location.hash = '#/' + pageId;
  },

  initPages: function(){
    const thisApp = this;

    thisApp.pages = Array.from(document.querySelector(select.containerOf.pages).children);
    thisApp.navLinks = Array.from(document.querySelectorAll(select.nav.links));

    let pagesMatchingHash = [];

    if(window.location.hash.length > 2){
      const idFromHash = window.location.hash.replace('#/', '');

      pagesMatchingHash = thisApp.pages.filter(function(page){
        return page.id == idFromHash;
      });
    }

    thisApp.activatePage(pagesMatchingHash.length ? pagesMatchingHash[0].id : thisApp.pages[0].id);

    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;

        event.preventDefault();

        const pageHrefId = clickedElement.getAttribute('href');
        const pageIdText = pageHrefId.replace('#', '');

        thisApp.activatePage(pageIdText);
      });
    }
  },

  initBooking: function(){
    const thisApp = this;

    const bookingContainer = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(bookingContainer);
  },

  initMenu: function(){
    const thisApp = this;
    for(let productData in thisApp.data.products){
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function(){
    const thisApp = this;
    const url = settings.db.url + '/' + settings.db.product;

    thisApp.data = {};

    fetch(url)
      .then(rawResponse => rawResponse.json())
      .then(parsedResponse => {
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });

  },

  initCart: function(){
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event){
      thisApp.cart.add(event.detail.product);
    });
  },

  initCarousel: function(){
    let myIndex = 0;
    carousel();

    function carousel() {
      const slides = document.querySelectorAll(select.slides.slide);
      const dots = document.querySelectorAll(select.slides.dot);

      for (let i = 0; i < slides.length; i++) {
        slides[i].classList.add(classNames.slides.invisible);
      }

      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove(classNames.slides.dotDark);
        dots[i].classList.add(classNames.slides.dotLight);
      }

      myIndex++;

      if (myIndex > slides.length){
        myIndex = 1;
      }

      slides[myIndex-1].classList.remove(classNames.slides.invisible);

      if (myIndex > dots.length){
        myIndex = 1;
      }

      dots[myIndex-1].classList.replace(classNames.slides.dotLight, classNames.slides.dotDark);


      setTimeout(carousel, 3000);
    }

  },

  init: function(){
    const thisApp = this;
    /* console.log('*** App starting ***');
    console.log('thisApp:', thisApp);
    console.log('classNames:', classNames);
    console.log('settings:', settings);
    console.log('templates:', templates); */
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
    thisApp.initCarousel();
  },
};

app.init();
