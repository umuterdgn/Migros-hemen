sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("migros.controller.Home", {
      onInit: function () {
        var oController = this;
        var oModel = new JSONModel({
          newProduct: {
            kategori_id: null,
            subcategory_id: null,
            ad: "",
            price: "",
            stock: "",
            image_url: "",
            discount_type: "none",
            discount_value: 0,
            category: "",
          },
          categories: [],
          subcategories: [],
        });
        this.getView().setModel(oModel);

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
                      width: "120px",
                      height: "120px",
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

      onSubCategoryChange: function (oEvent) {
        var selectedItem = oEvent.getParameter("selectedItem");
        if (!selectedItem) return;
        var selectedKey = selectedItem.getKey();

        this.getView()
          .getModel()
          .setProperty("/newProduct/subcategory_id", selectedKey);
      },

      onUrunEkle: function () {
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

        fetch("http://localhost:8081/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newProduct.ad,
            price: newProduct.price,
            stock: newProduct.stock,
            image_url: newProduct.image_url,
            subcategory_id: newProduct.subcategory_id,
            discount_type: newProduct.discount_type,
            discount_value: newProduct.discount_value,
            category: newProduct.kategori_id,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              MessageToast.show("Ürün başarıyla eklendi!");
              oModel.setProperty("/newProduct", {
                kategori_id: null,
                subcategory_id: null,
                ad: "",
                price: "",
                stock: "",
                image_url: "",
                discount_type: "none",
                discount_value: 0,
                category: "",
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
        const imageUrl = response.imageUrl;

        const oModel = this.getView().getModel();
        if (oModel) {
          oModel.setProperty("/newProduct/image_url", imageUrl);
        }

        sap.m.MessageToast.show("Görsel başarıyla yüklendi!");
      },

      onFileChange: function (oEvent) {
        const uploader = oEvent.getSource();
        if (uploader && uploader.getValue()) {
          uploader.upload();
        }
      },

      //ürünleri listeleme fonksiyonu
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

        $.ajax({
          url: "http://localhost:8081/api/products",
          method: "GET",
          success: function (data) {
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
          image_url: newProduct.image_url,
          subcategory_id: newProduct.subcategory_id,
          discount_type: newProduct.discount_type,
          discount_value: newProduct.discount_value,
          category: newProduct.kategori_id,
        };

        $.ajax({
          url: "http://localhost:8081/api/addProduct",
          method: "POST",
          data: JSON.stringify(jqrPrms),
          contentType: "application/json",
          processData: false,
          success: function (data) {
            _busy.close();

            var imageUrl = data.imageUrl;
            var oModel = that.getView().getModel();
            oModel.setProperty("/newProduct/image_url", data.imageUrl);

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
