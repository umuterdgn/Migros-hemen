sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
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
          category: ""  // kategori adı - isteğe bağlı
        },
        categories: [],
        subcategories: []
      });

      this.getView().setModel(oModel);

      // Ajax ile kategorileri çek ve model at
      $.ajax({
        url: "http://localhost:8081/api/categories",
        method: "GET",
        success: function (data) {
          oModel.setProperty("/categories", data);

          if (data.length > 0) {
            // İlk kategoriyi seç ve modelde güncelle
            oModel.setProperty("/newProduct/kategori_id", data[0].id);
            // İlk kategoriye ait alt kategorileri yükle
            oController.loadSubcategories(data[0].id);
          }
        },
        error: function () {
          MessageToast.show("Kategoriler yüklenemedi");
        }
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
          // oModel.setProperty("/newProduct/subcategory_id", null); // sıfırla
        },
        error: function () {
          MessageToast.show("Alt kategoriler yüklenemedi");
          oModel.setProperty("/subcategories", []);
        }
      });
    },

    onCategoryChange: function (oEvent) {
      var selectedItem = oEvent.getParameter("selectedItem");
      if (!selectedItem) return;
      var selectedKey = selectedItem.getKey();

      var oModel = this.getView().getModel();
      // oModel.setProperty("/newProduct/kategori_id", selectedKey);

      this.loadSubcategories(selectedKey);
    },

    onSubCategoryChange: function (oEvent) {
      var selectedItem = oEvent.getParameter("selectedItem");
      if (!selectedItem) return;
      var selectedKey = selectedItem.getKey();

      this.getView().getModel().setProperty("/newProduct/subcategory_id", selectedKey);
    },

    onUrunEkle: function () {
      const oModel = this.getView().getModel();
      const newProduct = oModel.getProperty("/newProduct");

      // zorunlu alanlar: ad(name), price, stock, kategori_id
      if (!newProduct.ad || !newProduct.price || !newProduct.stock || !newProduct.kategori_id) {
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
          category: newProduct.kategori_id // burası kategori id gönderiliyor backend tarafı ile uyumlu
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            MessageToast.show("Ürün başarıyla eklendi!");
            // Modeli sıfırla, görsel yükleme hariç tut (image_url boşaltılabilir ya da kalabilir)
            oModel.setProperty("/newProduct", {
              kategori_id: null,
              subcategory_id: null,
              ad: "",
              price: "",
              stock: "",
              image_url: "", // burada sıfırlamak veya korumak isteğe bağlı
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

    // görsel yükleme işlemi aynen kalsın
    onDrop: function (oEvent) {
      oEvent.preventDefault();
      const oFile = oEvent.originalEvent.dataTransfer.files[0];

      if (oFile) {
        this._uploadImage(oFile);
      }
    },

    onFileUploadClick: function () {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          this._uploadImage(file);
        }
      };
      input.click();
    },

    _uploadImage: function (file) {
      const formData = new FormData();
      formData.append("image", file);

      fetch("http://localhost:8081/api/upload", {
        method: "POST",
        body: formData
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const imageUrl = data.imageUrl;
            this.getView().byId("previewImage").setSrc(imageUrl);
            this.getView().byId("previewImage").setVisible(true);

            // Görsel URL'sini modele kaydet
            const oModel = this.getView().getModel();
            const newProduct = oModel.getProperty("/newProduct");
            newProduct.image_url = imageUrl;
            oModel.setProperty("/newProduct", newProduct);
          }
        })
        .catch((error) => {
          console.error("Yükleme hatası:", error);
        });
    }

  });
});
