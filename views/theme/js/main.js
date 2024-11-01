
(function ($) {
    "use strict";

    /*[ Load page ]
    ===========================================================*/
    $(".animsition").animsition({
        inClass: 'fade-in',
        outClass: 'fade-out',
        inDuration: 1500,
        outDuration: 800,
        linkElement: '.animsition-link',
        loading: true,
        loadingParentElement: 'html',
        loadingClass: 'animsition-loading-1',
        loadingInner: '<div class="loader05"></div>',
        timeout: false,
        timeoutCountdown: 5000,
        onLoadEvent: true,
        browser: [ 'animation-duration', '-webkit-animation-duration'],
        overlay : false,
        overlayClass : 'animsition-overlay-slide',
        overlayParentElement : 'html',
        transition: function(url){ window.location.href = url; }
    });
    
    /*[ Back to top ]
    ===========================================================*/
    var windowH = $(window).height()/2;

    $(window).on('scroll',function(){
        if ($(this).scrollTop() > windowH) {
            $("#myBtn").css('display','flex');
        } else {
            $("#myBtn").css('display','none');
        }
    });

    $('#myBtn').on("click", function(){
        $('html, body').animate({scrollTop: 0}, 300);
    });


    /*==================================================================
    [ Fixed Header ]*/
    var headerDesktop = $('.container-menu-desktop');
    var wrapMenu = $('.wrap-menu-desktop');

    if($('.top-bar').length > 0) {
        var posWrapHeader = $('.top-bar').height();
    }
    else {
        var posWrapHeader = 0;
    }
    

    if($(window).scrollTop() > posWrapHeader) {
        $(headerDesktop).addClass('fix-menu-desktop');
        $(wrapMenu).css('top',0); 
    }  
    else {
        $(headerDesktop).removeClass('fix-menu-desktop');
        $(wrapMenu).css('top',posWrapHeader - $(this).scrollTop()); 
    }

    $(window).on('scroll',function(){
        if($(this).scrollTop() > posWrapHeader) {
            $(headerDesktop).addClass('fix-menu-desktop');
            $(wrapMenu).css('top',0); 
        }  
        else {
            $(headerDesktop).removeClass('fix-menu-desktop');
            $(wrapMenu).css('top',posWrapHeader - $(this).scrollTop()); 
        } 
    });


    /*==================================================================
    [ Menu mobile ]*/
    $('.btn-show-menu-mobile').on('click', function(){
        $(this).toggleClass('is-active');
        $('.menu-mobile').slideToggle();
    });

    var arrowMainMenu = $('.arrow-main-menu-m');

    for(var i=0; i<arrowMainMenu.length; i++){
        $(arrowMainMenu[i]).on('click', function(){
            $(this).parent().find('.sub-menu-m').slideToggle();
            $(this).toggleClass('turn-arrow-main-menu-m');
        })
    }

    $(window).resize(function(){
        if($(window).width() >= 992){
            if($('.menu-mobile').css('display') == 'block') {
                $('.menu-mobile').css('display','none');
                $('.btn-show-menu-mobile').toggleClass('is-active');
            }

            $('.sub-menu-m').each(function(){
                if($(this).css('display') == 'block') { console.log('hello');
                    $(this).css('display','none');
                    $(arrowMainMenu).removeClass('turn-arrow-main-menu-m');
                }
            });
                
        }
    });


    /*==================================================================
    [ Show / hide modal search ]*/
    $('.js-show-modal-search').on('click', function(){
        $('.modal-search-header').addClass('show-modal-search');
        $(this).css('opacity','0');
    });

    $('.js-hide-modal-search').on('click', function(){
        $('.modal-search-header').removeClass('show-modal-search');
        $('.js-show-modal-search').css('opacity','1');
    });

    $('.container-search-header').on('click', function(e){
        e.stopPropagation();
    });


    /*==================================================================
    [ Isotope ]*/
    var $topeContainer = $('.isotope-grid');
    var $filter = $('.filter-tope-group');

    // filter items on button click
    $filter.each(function () {
        $filter.on('click', 'button', function () {
            var filterValue = $(this).attr('data-filter');
            $topeContainer.isotope({filter: filterValue});
        });
        
    });

    // init Isotope
    $(window).on('load', function () {
        var $grid = $topeContainer.each(function () {
            $(this).isotope({
                itemSelector: '.isotope-item',
                layoutMode: 'fitRows',
                percentPosition: true,
                animationEngine : 'best-available',
                masonry: {
                    columnWidth: '.isotope-item'
                }
            });
        });
    });

    var isotopeButton = $('.filter-tope-group button');

    $(isotopeButton).each(function(){
        $(this).on('click', function(){
            for(var i=0; i<isotopeButton.length; i++) {
                $(isotopeButton[i]).removeClass('how-active1');
            }

            $(this).addClass('how-active1');
        });
    });

    /*==================================================================
    [ Filter / Search product ]*/
    $('.js-show-filter').on('click',function(){
        $(this).toggleClass('show-filter');
        $('.panel-filter').slideToggle(400);

        if($('.js-show-search').hasClass('show-search')) {
            $('.js-show-search').removeClass('show-search');
            $('.panel-search').slideUp(400);
        }    
    });

    $('.js-show-search').on('click',function(){
        $(this).toggleClass('show-search');
        $('.panel-search').slideToggle(400);

        if($('.js-show-filter').hasClass('show-filter')) {
            $('.js-show-filter').removeClass('show-filter');
            $('.panel-filter').slideUp(400);
        }    
    });




    /*==================================================================
    [ Cart ]*/
     // Show cart when .js-show-cart is clicked
     $('.js-show-cart').on('click', function() {
        $.ajax({
            url: '/cart', // Make sure this matches your Express route
            method: 'GET',
            success: function(data) {
                // Inject the fetched HTML into the panel cart div
                $('.js-panel-cart').html(data);
                // Show the cart by adding the class
                $('.js-panel-cart').addClass('show-header-cart');
            },
            error: function(xhr) {
                console.error('Error loading cart:', xhr.responseText);
            }
        });
    });
    
    // Hide cart on click
    $('.js-hide-cart').on('click', function() {
        $('.js-panel-cart').removeClass('show-header-cart');
    });
    
    
    // $('.js-show-cart').on('click',function(){
    //     $('.js-panel-cart').addClass('show-header-cart');
    // });

    // $('.js-hide-cart').on('click',function(){
    //     $('.js-panel-cart').removeClass('show-header-cart');
    // });

    /*==================================================================
    [ Cart ]*/
    $('.js-show-sidebar').on('click',function(){
        $('.js-sidebar').addClass('show-sidebar');
    });

    $('.js-hide-sidebar').on('click',function(){
        $('.js-sidebar').removeClass('show-sidebar');
    });



    /*[ Cart Add to Cart Functionality ]*/
    $('.js-add-to-cart').on('click', function (e) {
        e.preventDefault();
    
        var $this = $(this);
        
        // Log the entire button element for inspection
        console.log('Button element:', $this);
    
        // Log the HTML to see the rendered data attribute
        console.log('Button HTML:', $this.prop('outerHTML'));
    
        // Capture the product ID
        var productId = $this.data('product-id');
        
        // Log the captured product ID
        console.log('Captured product ID:', productId);
    
        var $productContainer = $this.closest('.p-t-33');
        var quantity = parseInt($productContainer.find('input[name="num-product"]').val()) || 1;
        var size = $productContainer.find('select[name="size"]').val();
        var color = $productContainer.find('select[name="color"]').val();
    
        var cartData = {
            productId: productId,  // Keep as a string
            quantity: quantity,
            size: size,
            color: color
        };
    
        console.log('Sending cart data:', cartData);
    
        $.ajax({
            url: '/addCart',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(cartData),
            success: function (response) {
                console.log('Success response:', response);
                alert('Item added to cart!');
            },
            error: function (xhr) {
                console.error('Error:', xhr.responseText);
                alert('Error adding item to cart.');
            }
        });
    });
    
    

    // Function to update cart preview
    function updateCartPreview() {
        console.log('Updating cart preview...'); // Log for debugging purposes

        $.ajax({
            url: '/cart',
            method: 'GET',
            success: function (response) {
                console.log('Cart details fetched successfully:', response); // Log the response

                // Update the cart icon with the number of items and total cost
                if (response && response.cartItems && response.cartItems.length) {
                    $('#cart-count').text(response.cartItems.length); // Assuming you have a cart count element
                    $('#cart-total').text('$' + response.total.toFixed(2)); // Assuming you have a total price element
                } else {
                    $('#cart-count').text(0);
                    $('#cart-total').text('$0.00');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching cart details:', xhr.responseText, status, error);
                alert('There was an issue fetching your cart details. Please try again later.');
            }
        });
    }
    

    /*==================================================================
    [ +/- num product ]*/
    $('.btn-num-product-down').on('click', function(){
        var numProduct = Number($(this).next().val());
        if(numProduct > 0) $(this).next().val(numProduct - 1);
    });

    $('.btn-num-product-up').on('click', function(){
        var numProduct = Number($(this).prev().val());
        $(this).prev().val(numProduct + 1);
    });


    // /*==================================================================
    // [ +/- num product ]*/
    // $('.btn-num-product-down').on('click', function(){
    //     var numProduct = Number($(this).next().val());
    //     if(numProduct > 0) $(this).next().val(numProduct - 1);
    // });

    // $('.btn-num-product-up').on('click', function(){
    //     var numProduct = Number($(this).prev().val());
    //     $(this).prev().val(numProduct + 1);
    // });

    /*==================================================================
    [ Rating ]*/
    $('.wrap-rating').each(function(){
        var item = $(this).find('.item-rating');
        var rated = -1;
        var input = $(this).find('input');
        $(input).val(0);

        $(item).on('mouseenter', function(){
            var index = item.index(this);
            var i = 0;
            for(i=0; i<=index; i++) {
                $(item[i]).removeClass('zmdi-star-outline');
                $(item[i]).addClass('zmdi-star');
            }

            for(var j=i; j<item.length; j++) {
                $(item[j]).addClass('zmdi-star-outline');
                $(item[j]).removeClass('zmdi-star');
            }
        });

        $(item).on('click', function(){
            var index = item.index(this);
            rated = index;
            $(input).val(index+1);
        });

        $(this).on('mouseleave', function(){
            var i = 0;
            for(i=0; i<=rated; i++) {
                $(item[i]).removeClass('zmdi-star-outline');
                $(item[i]).addClass('zmdi-star');
            }

            for(var j=i; j<item.length; j++) {
                $(item[j]).addClass('zmdi-star-outline');
                $(item[j]).removeClass('zmdi-star');
            }
        });
    });
    
    /*==================================================================
    [ Show modal1 ]*/
        // Handle the 'Quick View' button click event
    $('.js-show-modal1').on('click', function(e) {
        e.preventDefault();  // Prevent the default behavior (navigation)
        
        // Get the URL from the href attribute
        var productUrl = $(this).attr('href');
        
        // Show the modal
        $('.js-modal1').addClass('show-modal1');
        
        // Make an AJAX call to fetch the product details view
        $.ajax({
            url: productUrl,
            method: 'GET',
            success: function(response) {
                // Load the response (HTML view) into the modal content
                $('#modal-content').html(response);
            },
            error: function() {
                $('#modal-content').html('<p>Error loading product details.</p>');
            }
        });
    });

    // Handle modal close
    $('.js-hide-modal1').on('click', function() {
        $('.js-modal1').removeClass('show-modal1');
        $('#productDetails').html('');
    });



})(jQuery);