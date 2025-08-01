sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap\/m\/MessageToast", "sap\/ui\/core\/Popup",
    
  ],
  function (Controller, JSONModel, MessageToast, Popup) {
    "use strict";

    return Controller.extend("migros.controller.Home", {
      onInit: function () {
        var oController = this;
        var oModel = new JSONModel({
  newProduct: {
    kategori_id: null,
    subcategory_id: null,
    brand_id: null,           // <- burayı ekleyin
    ad: "",
    price: "",
    stock: "",
    image_url: "",
    discount_scope: "product", // varsayılan scope
    discount_type: "none",
    discount_value: 0,
    category: ""
  },

  categories: [],
  subcategories: [],
  brands: []                 // <- brands dizisini ekleyin
});
        this.getView().setModel(oModel);
        $.ajax({
  url: "http://localhost:8081/api/brands",
  method: "GET",
  success: function(data) {
    oModel.setProperty("/brands", data);
  },
  error: function() {
    MessageToast.show("Markalar yüklenemedi");
  }
});

        $.ajax({
          url: "http://localhost:8081/api/categories",
          method: "GET",
          success: function (data) {
            oModel.setProperty("/categories", data);

            var oHBox = oController.byId("categoryContainer");
            if (oHBox) {
              oHBox.removeAllItems();

              data.forEach(function (category) {
                var oVBox = new sap.m.VBox({
                  width: "180px",
                  height: "180px",
                  alignItems: "Center",
                  justifyContent: "Center",
                  items: [
                    new sap.m.Button({
                      icon: "sap-icon://product",
                      width: "150px",
                      height: "150px",
                      press: function () {
                        var oRouter =
                          sap.ui.core.UIComponent.getRouterFor(oController);
                        oRouter.navTo("productRoute", {
                          categoryId: category.id,
                          categoryName: category.ad,
                        });
                      },
                    }),
                    new sap.m.Text({
                      text: category.ad,
                      textAlign: "Center",
                    }),
                  ],
                });
                oHBox.addItem(oVBox);
              });
            }

            if (data.length > 0) {
              oModel.setProperty("/newProduct/kategori_id", data[0].id);
              oController.loadSubcategories(data[0].id);
            }
          },
          error: function () {
            MessageToast.show("Kategoriler yüklenemedi");
          },
        });
      },

      loadSubcategories: function (categoryId) {
        var that = this;

        $.ajax({
          url: `http://localhost:8081/api/getSubCategories?kategori=${categoryId}`,
          method: "GET",
          success: function (data) {
            var oModel = that.getView().getModel();
            oModel.setProperty("/subcategories", data);
          },
          error: function () {
            MessageToast.show("Alt kategoriler yüklenemedi");
            that.getView().getModel().setProperty("/subcategories", []);
          },
        });
      },

      onCategoryChange: function (oEvent) {
        var selectedItem = oEvent.getParameter("selectedItem");
        if (!selectedItem) return;
        var selectedKey = selectedItem.getKey();

        this.loadSubcategories(selectedKey);
      },

//      onSubCategoryChange: function(oEvent) {
//   const subId = oEvent.getParameter("selectedItem").getKey();
//   const oModel = this.getView().getModel();

//   oModel.setProperty("/newProduct/subcategory_id", subId);

//   // markaları yükle ve modele set et
//   $.ajax({
//     url: `http://localhost:8081/api/brands-by-subcategory?subId=${subId}`,
//     method: "GET",
//     success: function(data) {
//       oModel.setProperty("/brands", data);
//     },
//     error: function() {
//       MessageToast.show("Markalar yüklenemedi");
//       oModel.setProperty("/brands", []);
//     }
//   });
// },

    onUrunEkle: function () {
  const oModel = this.getView().getModel();

  // Modelden direkt alıyoruz
  const name           = oModel.getProperty("/newProduct/ad");
  const price          = Number(oModel.getProperty("/newProduct/price"));
  const stock          = Number(oModel.getProperty("/newProduct/stock"));
  const base64         = oModel.getProperty("/newProduct/base64") || null;
  const subcategory_id = Number(oModel.getProperty("/newProduct/subcategory_id"));
  const brand_id       = Number(oModel.getProperty("/newProduct/brand_id"));
  const discount_scope = oModel.getProperty("/newProduct/discount_scope") || "product";
  const discount_type  = oModel.getProperty("/newProduct/discount_type")  || "none";
  const discount_value = Number(oModel.getProperty("/newProduct/discount_value")) || 0;
  const category       = Number(oModel.getProperty("/newProduct/kategori_id"));

  // Zorunlu alan kontrolü
  if (!name || !price || !stock || !category || !brand_id || !subcategory_id) {
    MessageToast.show("Lütfen zorunlu alanları doldurun!");
    return;
  }

  // POST isteği
  fetch("http://localhost:8081/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      price,
      stock,
      base64,
      subcategory_id,
      brand_id,
      discount_scope,
      discount_type,
      discount_value,
      category
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        MessageToast.show("Ürün başarıyla eklendi!");
        // Formu temizle
        oModel.setProperty("/newProduct", {
          kategori_id: null,
          subcategory_id: null,
          brand_id: null,
          ad: "",
          price: "",
          stock: "",
          base64: "",
          discount_scope: "product",
          discount_type: "none",
          discount_value: 0,
          category: ""
        });
      } else {
        MessageToast.show("Ürün eklenemedi: " + data.message);
      }
    })
    .catch(() => {
      MessageToast.show("Sunucu hatası!");
    });
},
      onDrop: function (oEvent) {
        oEvent.preventDefault();
        const oFile = oEvent.originalEvent.dataTransfer.files[0];

        if (oFile) {
          this._uploadImage(oFile);
        }
      },

      onUploadComplete: function (oEvent) {
        const response = JSON.parse(oEvent.getParameter("responseRaw"));
        const base64 = response.base64;

        const oModel = this.getView().getModel();
        if (oModel) {
          oModel.setProperty("/newProduct/base64", base64);
        }

        sap.m.MessageToast.show("Görsel başarıyla yüklendi!");
      },

      onFileChange: function (oEvent) {
        const uploader = oEvent.getSource();
        if (uploader && uploader.getValue()) {
          uploader.upload();
        }
      },
      onFileSelect: function(oEvent) {
  const file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
  if (!file) { return; }
  const reader = new FileReader();
  reader.onload = e => {
    // e.target.result => "data:image/png;base64,....."
    const dataUrl = e.target.result;
    const b64 = dataUrl.split(",")[1];

    // Model’e hem base64 hem önizleme için dataUrl
    const oModel = this.getView().getModel();
    oModel.setProperty("/newProduct/base64", b64);
    oModel.setProperty("/newProduct/image_url", dataUrl);

    MessageToast.show("Görsel Kaydedildi");
  };
  reader.readAsDataURL(file);
},

onSubCategoryChange: function(oEvent) {
  const subId = oEvent.getParameter("selectedItem").getKey();
  const oModel = this.getView().getModel();
  oModel.setProperty("/newProduct/subcategory_id", subId);

 $.ajax({
  url: "http://localhost:8081/api/brands",
  method: "GET",
  success: data => oModel.setProperty("/brands", data),
  error: () => MessageToast.show("Markalar yüklenemedi")
});


},

onBrandChange: function(oEvt) {
  // Seçilen değer
  const sKey = oEvt.getParameter("selectedItem").getKey();

  // Bu Select’in selectedKey binding path’ini al
  const sBindingPath = oEvt.getSource().getBindingInfo("selectedKey").parts[0].path;
  // örn: "/newProduct/brand_id" veya "/editProduct/brand_id"

  // Model’e yaz
  this.getView().getModel().setProperty(sBindingPath, parseInt(sKey, 10));
},


// Ürün ekle butonu
// onUrunEkle: function() {
//   const oModel = this.getView().getModel();
//   const p = oModel.getProperty("/newProduct");
//   // fetch ile POST /api/addProduct’e gönderirken:
//   fetch("http://localhost:8081/api/products", {
//     method: "POST",
//     headers: {"Content-Type":"application/json"},
//     body: JSON.stringify({
//       name: p.ad, price: p.price, stock: p.stock,
//       base64: p.base64,
//       subcategory_id: p.subcategory_id,
//       brand_id: p.brand_id,
//       discount_scope: p.discount_scope,
//       discount_type: p.discount_type,
//       discount_value: p.discount_value,
//       category: p.kategori_id
//     })
//   })
//   // …
// },
        //ürünleri listeleme fonksiyonu

        calculateEffectivePrice: function(price, type, value) {
  switch (type) {
    case "percent":
      return Math.round(price * (1 - value / 100));
    case "amount":
      return Math.max(0, price - value);
    default:
      return price;
  }
},  
      onShowAddProduct: function () {
        this.byId("addProductPanel").setVisible(true);
        this.byId("productListPanel").setVisible(false);
      },

      onShowProductList: function () {
        this.byId("addProductPanel").setVisible(false);
        this.byId("productListPanel").setVisible(true);
        this.loadProductList(); // ürünleri getir
      },

      loadProductList: function () {
  var oModel = this.getView().getModel();
  var that = this;

  $.ajax({
    url: "http://localhost:8081/api/products",
    method: "GET",
    success: function (data) {
      // Her ürüne effectivePrice alanını ekliyoruz
      data.forEach(function(item) {
        item.effectivePrice = that.calculateEffectivePrice(
          item.price,
          item.discount_type,
          item.discount_value
        );
      });
      oModel.setProperty("/productList", data);
    },
    error: function () {
      sap.m.MessageToast.show("Ürünler yüklenemedi.");
    },
  });
},
      onSearchProduct: function (oEvent) {
        var sQuery = oEvent.getParameter("query").toLowerCase();
        var oModel = this.getView().getModel();
        var aProducts = oModel.getProperty("/productList") || [];
        var aFiltered = aProducts.filter((p) =>
          p.name.toLowerCase().includes(sQuery)
        );
        oModel.setProperty("/productList", aFiltered);
      },

      onSortProduct: function (oEvent) {
        var sKey = oEvent.getParameter("selectedItem").getKey();
        var oModel = this.getView().getModel();
        var aProducts = oModel.getProperty("/productList") || [];

        aProducts.sort((a, b) => {
          if (typeof a[sKey] === "string") {
            return a[sKey].localeCompare(b[sKey]);
          }
          return a[sKey] - b[sKey];
        });

        oModel.setProperty("/productList", aProducts);
      },



 // ürün düzenleme popup açma
    onEditProduct: function (oEvent) {
      const oSelected = oEvent.getSource().getBindingContext().getObject();
      this.getView().getModel().setProperty("/editProduct", Object.assign({}, oSelected));  // deep copy editProduct'a koyuldu
      this.loadSubcategoriesForEdit(oSelected.category);  // kategori_id ise 'category' alanı
      this.byId("editDialog").open();  // popup açıldı
    },

    // güncelleme popup içi kategori değişiminde alt kategori yükleme
    loadSubcategoriesForEdit: function (categoryId) {
      const that = this;
      $.ajax({
        url: `http://localhost:8081/api/getSubCategories?kategori=${categoryId}`,
        method: "GET",
        success: function (data) {
          that.getView().getModel().setProperty("/filteredSubCategories", data);
        },
        error: function () {
          MessageToast.show("Alt kategoriler yüklenemedi");
        }
      });
    },
    // Popup kategori değiştiğinde
    onDialogCategoryChange: function (oEvent) {
      const selectedKey = oEvent.getParameter("selectedItem").getKey();
      const oModel = this.getView().getModel();
      oModel.setProperty("/editProduct/category", selectedKey);  // kategori_id güncelle
      this.loadSubcategoriesForEdit(selectedKey);               // alt kategorileri yenile
    },

    // görseli base64 formatına çevir ve modele kaydet
    onEditFileChange: function (oEvent) {
      const that = this;
      const file = oEvent.getParameter("files")[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        const b64 = e.target.result.split(",")[1];
        // modelde hem image_url hem de base64 saklanıyor
        const oModel = that.getView().getModel();
        oModel.setProperty("/editProduct/base64", b64);  // base64 verisi eklendi
        oModel.setProperty("/editProduct/image_url", "data:image/png;base64," + b64);  // önizleme için data URL
      };
      reader.readAsDataURL(file);
    },
    _loadProductsByCategory: function(categoryId) {
  $.ajax({
    url: `http://localhost:8081/api/products-category?categoryId=${categoryId}`,
    method: "GET",
    success: function(data) {
      this.getView().getModel().setProperty("/productList", data);
    }.bind(this),
    error: function() {
      MessageToast.show("Ürünler yüklenemedi");
    }
  });
},


    // kaydet butonuna tıklanınca 
   onSaveEditedProduct: function () {
  const oModel = this.getView().getModel();
  const oData = oModel.getProperty("/editProduct");
  if (!oData.id) {
    MessageToast.show("Güncellenecek ürün yok");
    return;
  }
     // id'yi ve brand_id'yi ekle
  oData.brand_id = parseInt(this.byId("brandSelect").getSelectedKey(), 10);
      // id'yi de ekle
    $.ajax({
  url: `http://localhost:8081/api/products?id=${oData.id}`,
  method: "PUT",
  contentType: "application/json",
  data: JSON.stringify(oData),  // id, base64 dahil tüm alanlar gönderiliyor
        success: () => {
          MessageToast.show("Ürün başarıyla güncellendi");
          this.byId("editDialog").close();
           var currentCategory = this.getView().getModel().getProperty("/newProduct/kategori_id");
      this.loadProductList();
    },
        
        error: () => MessageToast.show("Güncelleme sırasında hata oluştu")
      });
    },
    onDeleteProduct: function (oEvent) {
      var oProduct = oEvent.getSource().getBindingContext().getObject();
      if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
        $.ajax({
          url: "http://localhost:8081/api/products?id=" + oProduct.id,
          method: "DELETE",
          success: function () {
            MessageToast.show("Ürün başarıyla silindi");
            this.loadProductList();
          }.bind(this),
          error: function () {
            MessageToast.show("Silme işlemi başarısız oldu");
          }
        });
      }
    },

    // Dialog kapatma fonksiyonu
    onDialogClose: function () {
      this.byId("editDialog").close();  // popup'ı kapat
    },
      //Görsel Yükleme fonksiyonu
      uploadFileForProduct: function (oEvent) {
        var that = this;
        var oFileUploader = oEvent.getSource();
        var oFile = oEvent.getParameter("files")[0];

        // Dosyayı base64 formatına çevirrdim
        this.readFileAsBase64(oFile, function (sBase64Data) {
          oFileUploader.data("base64", sBase64Data);
          that.onUploadPress2();
        });
      },
onDialogSubCategoryChange: function(oEvent) {
  const subId = oEvent.getParameter("selectedItem").getKey();
  this.getView().getModel().setProperty("/editProduct/subcategory_id", subId);
},

// Marka dialog içi değişince
onDialogBrandChange: function(oEvent) {
  const sBrandId = oEvent.getParameter("selectedItem").getKey();
  // Modelin /editProduct/brand_id alanını güncelle
  this.getView()
      .getModel()
      .setProperty("/editProduct/brand_id", sBrandId);
},


// İndirim tipi değişince
onDialogDiscountTypeChange: function (oEvent) {
  const sType = oEvent.getParameter("selectedItem").getKey();
  this.getView().getModel().setProperty("/editProduct/discount_type", sType);
},

// İndirim değeri liveChange olduğunda
onDialogDiscountValueChange: function (oEvent) {
  const fValue = parseFloat(oEvent.getParameter("value")) || 0;
  this.getView().getModel().setProperty("/editProduct/discount_value", fValue);
},

// Fiyat liveChange: yeni oldPrice'ı da set edin
onDialogPriceChange: function(oEvent) {
  const fNewPrice = parseFloat(oEvent.getParameter("value")) || 0;
  const oModel = this.getView().getModel();
  // Eğer indirim yoksa veya sıfırsa, oldPrice=price
  oModel.setProperty("/editProduct/price", fNewPrice);
  oModel.setProperty("/editProduct/oldPrice", fNewPrice);
},
      readFileAsBase64: function (oFile, callback) {
        var reader = new FileReader();
        reader.onloadend = function () {
          var result = reader.result.split(",")[1]; // base64 vevirdim
          callback(result);
        };
        reader.readAsDataURL(oFile);
      },
      onUploadPress2: function () {
        var that = this;
        var oFileUploader = that.byId("fileUploaderUpd");
        var sBase64Data = oFileUploader.data("base64");
        if (sBase64Data) {
          this.sendPostRequestNewTlp(sBase64Data);
        } else {
          alert("Dosya seçilmedi!");
        }
      },
      sendPostRequestNewTlp: function (sBase64Data) {
        var that = this;
        var txt = btoa(unescape(encodeURIComponent(sBase64Data)));

        var _busy = new sap.m.BusyDialog({
          text: "Dosyanız Sap Sistemine Aktarılıyor, Lütfen Bekleyin...",
          // customIcon: "img/busy.png",
        });
        _busy.open();
        const oModel = this.getView().getModel();
        const newProduct = oModel.getProperty("/newProduct");

        if (
          !newProduct.ad ||
          !newProduct.price ||
          !newProduct.stock ||
          !newProduct.kategori_id
        ) {
          MessageToast.show("Lütfen zorunlu alanları doldurun!");
          return;
        }

        var jqrPrms = {
          base64: txt,
          name: newProduct.ad,
          price: newProduct.price,
          stock: newProduct.stock,
          base64: newProduct.base64,
          subcategory_id: newProduct.subcategory_id,
          discount_type: newProduct.discount_type,
          discount_value: newProduct.discount_value,
          category: newProduct.kategori_id,
        };

        $.ajax({
          url: "http://localhost:8081/api/products",
          method: "POST",
          data: JSON.stringify(jqrPrms),
          contentType: "application/json",
          processData: false,
          success: function (data) {
            _busy.close();

            var base64 = data.base64;
            var oModel = that.getView().getModel();
            oModel.setProperty("/newProduct/base64", data.base64);

            MessageToast.show("Görsel başarıyla yüklendi!");

            // alt kısım isteğin doğrultusunda aynen bırakıldı
          },
          error: function () {
            _busy.close();
            MessageToast.show("Görsel yükleme hatası!");
          },
        });
      },
    });
  }
);
