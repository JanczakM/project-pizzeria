import {Product} from './components/product.js';
import {Cart} from './components/cart.js';
import {select, settings} from './settings.js';

const app = {
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

  init: function(){
    const thisApp = this;
    /* console.log('*** App starting ***');
    console.log('thisApp:', thisApp);
    console.log('classNames:', classNames);
    console.log('settings:', settings);
    console.log('templates:', templates); */

    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();
