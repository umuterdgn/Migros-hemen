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
        this.oRouter = this.getOwnerComponent().getRouter();
        this.oRouter
          .getRoute("productRoute")
          .attachPatternMatched(this._onObjectMatched, this);

        this.oModel = new JSONModel({
          view: {},
          subcategories: [],
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
        });
        this.getView().setModel(this.oModel);
      },

      _onObjectMatched: function (oEvent) {
        const categoryId = oEvent.getParameter("arguments").categoryId;
        const categoryName = oEvent.getParameter("arguments").categoryName;
        this.oModel.setProperty("/view/categoryad", categoryName);
        this._loadSubcategories(categoryId);
        this._loadProductsByCategory(categoryId);
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
        success: function (data) {
  for (var i = 0; i < data.length; i++) {
    data[i].src = "data:image/jpeg;base64," + data[i].base64;

   
    const originalPrice = parseFloat(data[i].price);
    const discount = parseFloat(data[i].discount_value);

    if (data[i].discount_type && data[i].discount_type !== "none") {
      data[i].oldPrice = originalPrice.toFixed(2); // Çizgili gösterilecek
      if (data[i].discount_type === "percentage" || data[i].discount_type === "rate") {
        data[i].price = (originalPrice - originalPrice * (discount / 100)).toFixed(2);
      } else if (data[i].discount_type === "fixed") {
        data[i].price = (originalPrice - discount).toFixed(2);
      }
    } else {
      data[i].oldPrice = null;
    }
  }

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
  const oBox = this.byId("UrunList");
  const oCartModel = this.getOwnerComponent().getModel("cartModel");
  let aCartItems = oCartModel.getProperty("/cartItems") || [];

  oBox.removeAllItems();

  items.forEach((product) => {
    // Kart container
    const oCard = new sap.m.VBox({}).addStyleClass("productBox");

    // Ürün görseli ve adı vs...
    oCard.addItem(new sap.m.Image({ src: product.src, width: "170px", height: "150px" }));
    oCard.addItem(new sap.m.Text({ text: product.name }).addStyleClass("productName"));
    // Fiyat gösterimi...
    // ...

    // Action alanı: HBox içine ya SepeteEkle butonu ya StepInput+Sil butonu gelecek
    const oActionHBox = new sap.m.HBox({ alignItems: "Center", justifyContent: "Start" });

    // Sepette var mı kontrol et
    const oInCart = aCartItems.find(item => item.id === product.id);

    if (!oInCart) {
      // Henüz sepette değil: sepete ekle butonu
      oActionHBox.addItem(new sap.m.Button({
        icon: "sap-icon://cart",
        type: "Emphasized",
        press: this.onSepeteEkle.bind(this, product)
      }).addStyleClass("sepeteEkleIkon"));
      oCard.addItem(oActionHBox);
    } else {
      // Sepette var: StepInput fragment + sil butonu
      // İlk önce fragment’i yükle ve konteks ile bind et
      Fragment.load({
        name: "migros.view.fragments.StepInput",
        controller: this
      }).then(function(oStepInput) {
        // bağlama: cartModel'de oInCart'ın index'ine
        const iIndex = aCartItems.indexOf(oInCart);
        oStepInput.setBindingContext(
          new sap.ui.model.Context(oCartModel, "/cartItems/" + iIndex),
          "cartModel"
        );
        // change event Product için farklı handler
        oStepInput.attachChange(this.onProductStepChange.bind(this));
        oActionHBox.addItem(oStepInput);

        // Sil butonu
        oActionHBox.addItem(new sap.m.Button({
          icon: "sap-icon://delete",
          press: () => this._removeFromCart(product.id)
        }));
      }.bind(this));

      oCard.addItem(oActionHBox);
    }

    oBox.addItem(oCard);
  });
},

onProductStepChange: function(oEvt) {
  const iNewQty = oEvt.getParameter("value");
  const sId = oEvt.getSource().getCustomData()[0].getValue();
  const oCartModel = this.getOwnerComponent().getModel("cartModel");
  let a = oCartModel.getProperty("/cartItems");
  let oItem = a.find(i => i.id === sId);
  if (oItem) {
    if (iNewQty <= 0) {
      // Sıfırlandıysa sepetten çıkar
      this._removeFromCart(sId);
    } else {
      // Aksi halde miktarı güncelle ve özet + ürünleri yeniden render et
      oItem.quantity = iNewQty;
      oCartModel.refresh();
      this._updateSummary(oCartModel);
    }
  }
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
onSepeteEkle: function (oProduct) {
  // oProduct artık direkt closure’dan geliyor, getSource falan yok
  var oCartModel = this.getOwnerComponent().getModel("cartModel");
  var aCartItems = oCartModel.getProperty("/cartItems") || [];
  var existing = aCartItems.find(item => item.id === oProduct.id);
  if (existing) {
    existing.quantity += 1;
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
  MessageToast.show(oProduct.name + " sepete eklendi");
   this._renderProducts(this.oModel.getProperty("/displayedProducts"));
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
      oModel.setProperty("/summary", { totalItems: totalItems, subtotal: subtotal.toFixed(2), discount: discount.toFixed(2), deliveryText: deliveryText, total: total, message: subtotal < 200 ? "Sepete " + (200 - subtotal).toFixed(2) + " ₺ ekle, ücretsiz teslimat için." : "" });
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
