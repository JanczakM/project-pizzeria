import {select, classNames, templates, settings} from '../settings.js';
import {utils} from '../utils.js';
import {CartProduct} from './cartproduct.js';

export class Cart{
  constructor(element){
    const thisCart = this;

    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];
    thisCart.selectors = ['productList', 'toggleTrigger', 'form', 'phone', 'address'];

    for(let key of thisCart.renderTotalsKeys){
      thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
    }

    for(let selector of thisCart.selectors){
      thisCart.dom[selector] = thisCart.dom.wrapper.querySelector(select.cart[selector]);
    }
  }

  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function(){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct){
    const thisCart = this;

    const generatedCartHTML = templates.cartProduct(menuProduct);
    const generatedCartDOM = utils.createDOMFromHTML(generatedCartHTML);
    thisCart.dom.productList.appendChild(generatedCartDOM);

    thisCart.products.push(new CartProduct(menuProduct, generatedCartDOM));

    thisCart.update();
  }

  update(){
    const thisCart = this;
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for(let productInstance of thisCart.products){
      thisCart.subtotalPrice += productInstance.price;
      thisCart.totalNumber += productInstance.amount;
    }

    if(thisCart.subtotalPrice == 0){
      thisCart.deliveryFee = 0;
    }

    thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;


    for(let key of thisCart.renderTotalsKeys){
      for(let elem of thisCart.dom[key]){
        elem.innerHTML = thisCart[key];
      }
    }
  }

  remove(cartProduct){
    const thisCart = this;

    const index = thisCart.products.indexOf(cartProduct);

    thisCart.products.splice(index, 1);
    thisCart.dom.productList.removeChild(cartProduct.dom.wrapper);
    thisCart.update();
  }

  sendOrder(){
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.order;

    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalNumber: thisCart.totalNumber,
      subtotalPrice: thisCart.subtotalPrice,
      deliveryFee: thisCart.deliveryFee,
      totalPrice: thisCart.totalPrice,
      products: [],
    };

    for(let product of thisCart.products){
      const getData = product.getData();
      payload.products.push(getData);
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(response => response.json())
      .then(parsedResponse => {
        console.log('parsedResponse', parsedResponse);
      });
  }

}
