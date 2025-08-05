sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",      
  "sap/ui/core/UIComponent"
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    Sorter,
    Filter,
    FilterOperator,
    Fragment,                      
    UIComponent
  ) {
    "use strict";

    return Controller.extend("migros.controller.Product", {
      onInit: function () {
        if (!this.getView().getModel("cartModel")) {
  this.getView().setModel(this.getOwnerComponent().getModel("cartModel"), "cartModel");
}
        this.oRouter = this.getOwnerComponent().getRouter();
        this.oRouter
          .getRoute("productRoute")
          .attachPatternMatched(this._onObjectMatched, this);

        this.oModel = new JSONModel({
          view: {},
          subcategories: [],
          brands: [],            
          UrunList: [],
          filteredProducts: [],
          displayedProducts: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            itemsPerPage: 30,
            hasNext: false,
            hasPrev: false,
            
          },
          
          
        });var oCartBtn = this.byId("btnCart");
  // if (oCartBtn) {
  //   oCartBtn.attachBrowserEvent("mouseover", this.onCartHover.bind(this));
  // }
        
        this.getView().setModel(this.oModel);

      },
      _updateCartBadge: function () {
  var oButton = this.byId("yourButtonId"); // ID kullanıyorsan
  if (oButton) {
    var oCartModel = this.getOwnerComponent().getModel("cartModel");
    var iCount = oCartModel.getProperty("/items")?.length || 0;

    const aCustomData = oButton.getCustomData();
    aCustomData.forEach((oData) => {
      if (oData.getKey() === "badge") {
        oData.setValue(iCount.toString());
      }
    });
  }
},
// onAfterRendering: function() {
//   if (!this._bHoverAttached) {
//     var oCartBtn = this.byId("btnCart");
//     if (oCartBtn) {
//       oCartBtn.attachBrowserEvent("mouseover", this.onCartHover.bind(this));
//       this._bHoverAttached = true;
//     }
//   }
// },

onSepeteSil: function(oEvt) {
  // Fragment içindeki customData’dan id al
  const sId = oEvt.getSource()
    .getCustomData()
    .find(d => d.getKey() === "id")
    .getValue();

  // Cart model’den ilgili ürünü çıkar
  const oCartModel = this.getOwnerComponent().getModel("cartModel");
  let aItems = oCartModel.getProperty("/cartItems") || [];
  aItems = aItems.filter(i => i.id !== parseInt(sId,10));
  oCartModel.setProperty("/cartItems", aItems);

  // Özet ve listeyi yeniden güncelle
  this._updateSummary(oCartModel);
  this._renderProducts(this.oModel.getProperty("/displayedProducts"));
},



      _onObjectMatched: function (oEvent) {
        const categoryId = oEvent.getParameter("arguments").categoryId;
        const categoryName = oEvent.getParameter("arguments").categoryName;
        this.oModel.setProperty("/view/categoryad", categoryName);
        this._loadSubcategories(categoryId);
        this._loadBrands(categoryId);   
        this._loadProductsByCategory(categoryId);
      },
loadProductList: function () {
  var oModel = this.getView().getModel();

  $.ajax({
    url: "http://localhost:8081/api/products",
    method: "GET",
    success: function (data) {
      // data bir dizi ürün: her biri { price, discount_type, discount_value, … }
      data.forEach(function (p) {
        let ep = p.price;
        if (p.discount_type === "percent") {
          ep = p.price * (1 - p.discount_value / 100);
        } else if (p.discount_type === "amount") {
          ep = p.price - p.discount_value;
        }
        // 2 ondalıkla sınırlandır ve modelde sakla
        p.effectivePrice = ep.toFixed(2);
      });
      oModel.setProperty("/productList", data);
    },
    error: function () {
      sap.m.MessageToast.show("Ürünler yüklenemedi.");
    },
  });
},


     _loadBrands: function (categoryId) {
  $.ajax({
    url: `http://localhost:8081/api/brands-by-category?categoryId=${categoryId}`,
    method: "GET",
    success: (data) => {
      this.oModel.setProperty("/brands", data);
      this._bindBrands();
    },
    error: (xhr) => {
      console.error("Marka yükleme hatası:", xhr);
      MessageToast.show("Markalar yüklenirken hata oluştu");
    }
  });
},
onCartHover: function() {
  var oButton = this.byId("btnCart");
  if (!this._cartPopover) {
    Fragment.load({
      name: "migros.view.fragments.CartPopover",
      controller: this
    }).then(function(oPopover) {
      this._cartPopover = oPopover;
      this.getView().addDependent(oPopover);
      oPopover.openBy(oButton);
    }.bind(this));
  } else {
    this._cartPopover.openBy(oButton);
  }
},

onAfterRendering: function() {
  if (!this._bHoverAttached) {
    var oCartBtn = this.byId("btnCart");
    if (oCartBtn) {
      oCartBtn.attachBrowserEvent("mouseover", this.onCartHover.bind(this));
      this._bHoverAttached = true;
    }
   var oSearchField = this.byId("searchField");
if (oSearchField) {
  oSearchField.addEventDelegate({
    onAfterRendering: function () {
      const el = oSearchField.getDomRef();
      if (el) {
        // En dış kapsayıcı
        // el.style.borderRadius = "2rem";
        // el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
        // el.style.border = "0.2px solid #ccc";
        
      }

      // İç wrapper (div)
      const innerDiv = el.querySelector(".sapMSFF");
      if (innerDiv) {
        innerDiv.style.borderRadius = "1rem";
        innerDiv.style.overflow = "hidden";
        innerDiv.style.border = "1px solid #ccc";

      }

      // Input alanı
      const input = el.querySelector("input");
      if (input) {
        input.style.borderRadius = "2rem";
      }

      // Search ikonu olan buton
      const btn = el.querySelector("button");
      if (btn) {
        btn.style.borderRadius = "1rem";
      }
      
    }
    
  });
}
  }
},



onPopoverAfterOpen: function() {
  var oPopover = this._cartPopover;
  var $pop = oPopover.$();           // Popover’ın jQuery nesnesi
  var that = this;

  // Fare popover’a girince kapanmayı durdur
  $pop.on("mouseenter", function() {
    clearTimeout(that._popCloseTimeout);
  });

  // Fare popover’dan çıkınca, 300ms sonra kapat
  $pop.on("mouseleave", function() {
    that._popCloseTimeout = setTimeout(function() {
      oPopover.close();
    }, 300);
  });
},


onPopoverAfterClose: function() {
  var oPopover = this._cartPopover;
  var $pop = oPopover.$();
  // Olayları temizle
  $pop.off("mouseenter mouseleave");
  clearTimeout(this._popCloseTimeout);
},


_bindBrands: function () {
  const oBrandList = this.byId("brandList");
  oBrandList.removeAllItems();
  this.oModel.getProperty("/brands").forEach(brand => {
    oBrandList.addItem(new sap.m.StandardListItem({
      title: brand.name,
      customData: [ new sap.ui.core.CustomData({ key: "brandId", value: brand.id }) ]
    }));
  });
},

onBrandSelect: function (oEvent) {
  // seçili listItem’ları al
  const selItems = this.byId("brandList").getSelectedItems();
  const all = this.oModel.getProperty("/UrunList");
  let filtered;

  if (selItems.length > 0) {
    // seçili ID’leri topla
    const selectedIds = selItems.map(i => i.getCustomData()[0].getValue());
    filtered = all.filter(p => selectedIds.includes(p.brand_id));
  } else {
    // hiç seçim yoksa, tüm ürünler
    filtered = all;
  }

  this.oModel.setProperty("/filteredProducts", filtered);
  this._paginate(1);
},
      _loadSubcategories: function (categoryId) {
        $.get(
          `http://localhost:8081/api/getSubCategories?kategori=${categoryId}`,
          (data) => {
            this.oModel.setProperty("/subcategories", data);
            this._bindSubcategories();
          }
        );
      },
    
      

      _bindSubcategories: function () {
        const oList = this.byId("subCategoryList");
        const data = this.oModel.getProperty("/subcategories");

        oList.removeAllItems();
        data.forEach((sub) => {
          oList.addItem(
            new sap.m.StandardListItem({
              title: sub.ad,
              customData: [
                new sap.ui.core.CustomData({ key: "id", value: sub.id }),
              ],
            })
          );
        });
      },

      _loadProductsByCategory: function (categoryId) {
        var that = this;
        // $.get(
        //   `http://localhost:8081/api/products-category?categoryId=${categoryId}`,
        //   (data) => {
        $.ajax({
          url:
            "http://localhost:8081/api/products-category?categoryId=" + (categoryId),
          dataType: "json",
          method: "GET",
        success: function(data) {
  data.forEach(item => {
    // ham fiyat
    const orig = parseFloat(item.price);
    let discType, discVal;

    if (item.discount_scope === "product") {
      discType = item.discount_type;
      discVal  = parseFloat(item.discount_value);
    } else {
      // marka bazlı
      discType = item.brand_disc_type;
      discVal  = parseFloat(item.brand_disc_value);
    }

    // eski ve yeni fiyatı hesaplayalım
    if (discType === "percent") {
      item.oldPrice = orig.toFixed(2);
      item.price = (orig * (1 - discVal/100)).toFixed(2);
    } else if (discType === "amount") {
      item.oldPrice = orig.toFixed(2);
      item.price = (orig - discVal).toFixed(2);
    } else {
      item.oldPrice = null;
      item.price = orig.toFixed(2);
    }

    // base64 → src
    item.src = "data:image/jpeg;base64," + item.base64;
  });


  // Model set işlemleri
  var oModel = new JSONModel();
  oModel.setData(data);
  that.getOwnerComponent().setModel(oModel, "UrunList");
  that.getOwnerComponent().getModel("UrunList").refresh();
  that.oModel.setProperty("/UrunList", data);
  that._applyFilters();
}

        });
      },

      onSubCategorySelect: function (oEvent) {
        const selectedItem = oEvent.getParameter("listItem");
        const subCatId = selectedItem.getCustomData()[0].getValue();
        const UrunList = this.oModel.getProperty("/UrunList");
        const filtered = UrunList.filter(
          (p) => p.subcategory_id == subCatId
        );
        this.oModel.setProperty("/filteredProducts", filtered);
        this._paginate(1);
      },

      onSearch: function (oEvent) {
        const query = oEvent.getParameter("newValue").toLowerCase();
        const filtered = this.oModel
          .getProperty("/UrunList")
          .filter((p) => p.name.toLowerCase().includes(query));
        this.oModel.setProperty("/filteredProducts", filtered);
        this._paginate(1);
      },

      onSortChange: function (oEvent) {
        const key = oEvent.getParameter("selectedItem").getKey();
        let sorted = [...this.oModel.getProperty("/filteredProducts")];

        switch (key) {
          case "priceAsc":
            sorted.sort((a, b) => a.price - b.price);
            break;
          case "priceDesc":
            sorted.sort((a, b) => b.price - a.price);
            break;
          case "discountAsc":
            sorted.sort((a, b) => a.discount_value - b.discount_value);
            break;
          case "discountDesc":
            sorted.sort((a, b) => b.discount_value - a.discount_value);
            break;
          case "nameAsc":
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "nameDesc":
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        }

        this.oModel.setProperty("/filteredProducts", sorted);
        this._paginate(1);
      },

      _applyFilters: function () {
        const products = this.oModel.getProperty("/UrunList");
        this.oModel.setProperty("/filteredProducts", products);

         const selItems = this.byId("brandList").getSelectedItems();
  if (selItems.length > 0) {
    const ids = selItems.map(i => i.getCustomData()[0].getValue());
    products = products.filter(p => ids.includes(p.brand_id));
  }

  this.oModel.setProperty("/filteredProducts", products);
  this._paginate(1);
},

      _paginate: function (page) {
        const all = this.oModel.getProperty("/filteredProducts");
        const perPage = this.oModel.getProperty("/pagination/itemsPerPage");
        const totalPages = Math.ceil(all.length / perPage);

        const start = (page - 1) * perPage;
        const pageItems = all.slice(start, start + perPage);

        this.oModel.setProperty("/pagination/currentPage", page);
        this.oModel.setProperty("/pagination/totalPages", totalPages);
        this.oModel.setProperty("/pagination/hasNext", page < totalPages);
        this.oModel.setProperty("/pagination/hasPrev", page > 1);
        this.oModel.setProperty("/displayedProducts", pageItems);

        this._renderProducts(pageItems);
      },
// Controller veya ayrı formatter.js içinde
stepInputLayout: function() {
  return new sap.m.FlexItemData({ growFactor: 0, shrinkFactor: 0 });
}
,
_renderProducts: function (items) {
  const oBox      = this.byId("UrunList");
  const oCartModel= this.getOwnerComponent().getModel("cartModel");
  let aCartItems  = oCartModel.getProperty("/cartItems") || [];

  oBox.removeAllItems();

  items.forEach((product) => {
    const oCard = new sap.m.VBox().addStyleClass("productBox");

    // --- 1) ÜRÜN GÖRSELİ ---
    oCard.addItem(new sap.m.Image({
      src:      product.src,     // modeldeki data:image… değeri
      width:    "170px",
      height:   "150px",
      decorative: false
    }));

    // --- 2) ÜRÜN ADI ---
    oCard.addItem(new sap.m.Text({
      text: product.name
    }).addStyleClass("productName"));

    // --- 3) FİYATLAR ---
    const oPriceBox = new sap.m.HBox({ alignItems: "Center", justifyContent: "Start" });
    if (product.oldPrice) {
      oPriceBox.addItem(new sap.m.Text({
        text: product.oldPrice + " ₺"
      }).addStyleClass("oldPrice"));
    }
    oPriceBox.addItem(new sap.m.Text({
      text: product.price + " ₺"
    }).addStyleClass("newPrice"));
    oCard.addItem(oPriceBox);

    // --- 4) SEPETE EKLE / STEPINPUT + SİL ---
    const oActionHBox = new sap.m.HBox({ alignItems: "Center", justifyContent: "Start" });
    const oInCart = aCartItems.find(item => item.id === product.id);

    if (!oInCart) {
      oActionHBox.addItem(new sap.m.Button({
        icon: "sap-icon://cart",
        type: sap.m.ButtonType.Emphasized,
        press: this.onSepeteEkle.bind(this, product),
        customData: [
          new sap.ui.core.CustomData({ key: "hasLimit", value: product.has_limit }),
          new sap.ui.core.CustomData({ key: "limitQty", value: product.limit_qty })
        ]
      }).addStyleClass("sepeteEkleIkon"));
    } else {
      Fragment.load({
        name: "migros.view.fragments.StepInput",
        controller: this
      }).then(function(oStepInput) {
        oStepInput
          .addCustomData(new sap.ui.core.CustomData({ key: "hasLimit", value: product.has_limit }))
          .addCustomData(new sap.ui.core.CustomData({ key: "limitQty", value: product.limit_qty }));
        const iIndex = aCartItems.indexOf(oInCart);
        oStepInput.setBindingContext(
          new sap.ui.model.Context(oCartModel, "/cartItems/" + iIndex),
          "cartModel"
        );
        oStepInput.attachChange(this.onProductStepChange.bind(this));
        oActionHBox.addItem(oStepInput);

        oActionHBox.addItem(new sap.m.Button({
          icon: "sap-icon://delete",
          press: () => this._removeFromCart(product.id)
        }));
      }.bind(this));
    }

    oCard.addItem(oActionHBox);
    oBox.addItem(oCard);
  });
},


onProductStepChange: function(oEvt) {
  const oStep    = oEvt.getSource();
  const iNewQty  = oEvt.getParameter("value");
  // customData’dan oku
  const hasLimit = oStep.getCustomData()
                        .find(cd => cd.getKey() === "hasLimit").getValue();
  const limitQty = oStep.getCustomData()
                        .find(cd => cd.getKey() === "limitQty").getValue();

  if (hasLimit && iNewQty > limitQty) {
    MessageToast.show(`Maksimum ${limitQty} adet ile sınırlısınız.`);
    oStep.setValue(limitQty);
    return;
  }

  // Model’deki quantity’yi güncelle
  const oCartModel = this.getOwnerComponent().getModel("cartModel");
  const sPath      = oStep.getBindingContext("cartModel").getPath(); // örn "/cartItems/2"
  oCartModel.setProperty(sPath + "/quantity", iNewQty);
  this._updateSummary(oCartModel);
},

_removeFromCart: function(sId) {
  const oCartModel = this.getOwnerComponent().getModel("cartModel");
  let a = oCartModel.getProperty("/cartItems") || [];
  a = a.filter(i => i.id !== sId);
  oCartModel.setProperty("/cartItems", a);
  this._updateSummary(oCartModel);

  // Ürün listesini de yeniden render et ki ikon geri gelsin
  this._renderProducts(this.oModel.getProperty("/displayedProducts"));
},


      onPressCart: function() {
         var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("cart");

            

            //İLERİKİ ZAMAN BAKILICAK 
  // const sToken = localStorage.getItem("token");
  // const oRouter = this.getOwnerComponent().getRouter();
  // if (!sToken) {
  //   // Giriş yoksa login sayfasına yönlendir
  //   oRouter.navTo("loginRoute");
  // } else {
  //   // Sepet sayfasına git
  // }
},
onNavBack: function () {
  window.history.back();
},
// Ürünü sepete ekle butonuna basıldığında
onSepeteEkle: function(oProduct) {
  // customData’dan oku
  const hasLimit = oProduct.has_limit;
  const limitQty = oProduct.limit_qty;

  const oCartModel = this.getOwnerComponent().getModel("cartModel");
  let aCartItems   = oCartModel.getProperty("/cartItems") || [];
  let existing     = aCartItems.find(i => i.id === oProduct.id);
  let newQty       = existing ? existing.quantity + 1 : 1;

  if (hasLimit && newQty > limitQty) {
    MessageToast.show(`Bu üründen en fazla ${limitQty} adet alabilirsiniz.`);
    return;
  }

  // normal sepete ekleme mantığı
  if (existing) {
    existing.quantity = newQty;
  } else {
    aCartItems.push({
      id:       oProduct.id,
      name:     oProduct.name,
      price:    parseFloat(oProduct.price),
      quantity: 1,
      src:      oProduct.src,
      oldPrice: oProduct.oldPrice || null
    });
  }
  oCartModel.setProperty("/cartItems", aCartItems);
  this._updateSummary(oCartModel);
  this._renderProducts(this.oModel.getProperty("/displayedProducts"));
  MessageToast.show(oProduct.name + " sepete eklendi");
  
},


    _updateSummary: function (oModel) {
      var aItems = oModel.getProperty("/cartItems") || [];
      var totalItems = 0, subtotal = 0, discount = 0;
      aItems.forEach(function (i) {
        totalItems += i.quantity;
        subtotal += i.price * i.quantity;
        if (i.oldPrice) { discount += (i.oldPrice - i.price) * i.quantity; }
      });
      var deliveryText = subtotal >= 200 ? "Ücretsiz" : (200 - subtotal).toFixed(2) + " ₺ eksik";
      var total = (subtotal - discount).toFixed(2);
      oModel.setProperty("/summary", {
    totalItems: totalItems,
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    total: total,
    deliveryText: deliveryText
    
  });

  const cartModel = this.getOwnerComponent().getModel("cartModel");
  cartModel.setProperty("/summary", oModel.getProperty("/summary"));
  
  // (isteğe bağlı) Butonun text’ini toplam adete göre değiştirmek:
  cartModel.setProperty("/buttonText", `Sepetim (${totalItems})`);
    },
      onNextPage: function () {
        const page = this.oModel.getProperty("/pagination/currentPage");
        this._paginate(page + 1);
      },

      onPrevPage: function () {
        const page = this.oModel.getProperty("/pagination/currentPage");
        this._paginate(page - 1);
      },
    });
  }
);
